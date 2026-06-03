// GitHub repo ingestion pipeline (T-GH-2).
//
// Fetches a project's connected repository via the GitHub App installation
// token, stores each relevant file as a Document row (source=GITHUB), chunks
// the text, and runs the embedding pipeline so searchKnowledge can find it.
//
// Re-syncing is idempotent: existing docs for the same file path are updated
// in-place (old chunks + embeddings cascade-deleted, re-chunked, re-embedded).

import { prisma } from "@/lib/db/prisma";
import { getInstallationToken } from "@/lib/github/client";
import { chunkText } from "@/lib/documents/chunk";
import { embedProjectChunks } from "@/lib/rag/pipeline";
import { DocSource, ConnectionStatus, Provider } from "@/generated/prisma/enums";

const GITHUB_API = "https://api.github.com";

const EXCLUDED_DIRS = new Set([
  "node_modules", ".next", "dist", "build", "coverage",
  ".git", "vendor", "__pycache__", ".cache", ".turbo",
]);

const INCLUDED_EXTENSIONS = new Set([
  ".md", ".mdx", ".txt", ".json", ".yaml", ".yml", ".toml",
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".sh",
]);

const MAX_FILES = 40;
const MAX_FILE_BYTES = 8_000;
const MAX_TOTAL_BYTES = 80_000;

export interface SyncResult {
  synced: number;
  embedded: number;
  errors: string[];
}

interface TreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

function shouldInclude(path: string, size?: number): boolean {
  if (size && size > MAX_FILE_BYTES) return false;
  const parts = path.split("/");
  if (parts.some((p) => EXCLUDED_DIRS.has(p))) return false;
  const lower = path.toLowerCase();
  if (lower.endsWith("readme.md") || lower === "readme") return true;
  const dotIdx = path.lastIndexOf(".");
  if (dotIdx === -1) return false;
  return INCLUDED_EXTENSIONS.has(path.slice(dotIdx).toLowerCase());
}

function mimeForPath(path: string): string {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  if (ext === ".md" || ext === ".mdx") return "text/markdown";
  if (ext === ".json") return "application/json";
  if (ext === ".yaml" || ext === ".yml") return "application/yaml";
  return "text/plain";
}

/**
 * Sync a project's connected GitHub repository into the knowledge base.
 * Upserts Document rows keyed by file path, re-chunks and re-embeds changed files.
 */
export async function syncGitHubRepo(projectId: string): Promise<SyncResult> {
  const errors: string[] = [];

  const connection = await prisma.projectConnection.findUnique({
    where: { projectId_provider: { projectId, provider: Provider.GITHUB } },
  });

  if (!connection || connection.status !== ConnectionStatus.CONNECTED) {
    throw new Error("GitHub is not connected for this project.");
  }
  if (!connection.externalRef) {
    throw new Error("No repository configured for this project.");
  }
  if (!connection.installationId) {
    throw new Error("GitHub App is not installed — please install it first.");
  }

  const [owner, repo] = connection.externalRef.split("/");
  const token = await getInstallationToken(connection.installationId);
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Fetch the full repo tree.
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) {
    const body = await treeRes.text();
    throw new Error(`GitHub tree fetch failed (${treeRes.status}): ${body}`);
  }
  const treeData = (await treeRes.json()) as { tree: TreeItem[] };

  const candidates = treeData.tree
    .filter((item) => item.type === "blob" && shouldInclude(item.path, item.size))
    .sort((a, b) => {
      const aReadme = a.path.toLowerCase().includes("readme");
      const bReadme = b.path.toLowerCase().includes("readme");
      if (aReadme !== bReadme) return aReadme ? -1 : 1;
      return a.path.split("/").length - b.path.split("/").length;
    })
    .slice(0, MAX_FILES);

  let synced = 0;
  let totalBytes = 0;

  for (const item of candidates) {
    if (totalBytes >= MAX_TOTAL_BYTES) break;

    const fileRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${item.path}`,
      { headers },
    );
    if (!fileRes.ok) continue;

    const fileData = (await fileRes.json()) as { content?: string; encoding?: string };
    if (!fileData.content || fileData.encoding !== "base64") continue;

    const rawText = Buffer.from(fileData.content.replace(/\n/g, ""), "base64")
      .toString("utf-8")
      .slice(0, MAX_FILE_BYTES);

    totalBytes += rawText.length;
    const mimeType = mimeForPath(item.path);
    const chunks = chunkText(rawText);

    try {
      const existing = await prisma.document.findFirst({
        where: { projectId, source: DocSource.GITHUB, sourceRef: item.path },
        select: { id: true },
      });

      await prisma.$transaction(async (tx) => {
        let docId: string;

        if (existing) {
          await tx.document.update({
            where: { id: existing.id },
            data: { rawText, mimeType, title: item.path },
          });
          // Delete old chunks — cascade removes their embeddings too.
          await tx.documentChunk.deleteMany({ where: { documentId: existing.id } });
          docId = existing.id;
        } else {
          const doc = await tx.document.create({
            data: {
              projectId,
              source: DocSource.GITHUB,
              title: item.path,
              sourceRef: item.path,
              mimeType,
              rawText,
              metadata: { repo: connection.externalRef, path: item.path },
            },
          });
          docId = doc.id;
        }

        if (chunks.length > 0) {
          await tx.documentChunk.createMany({
            data: chunks.map((c) => ({
              documentId: docId,
              chunkIndex: c.index,
              content: c.content,
              citation: `GitHub: ${connection.externalRef}/${item.path}#chunk${c.index}`,
            })),
          });
        }
      });

      synced++;
    } catch (e) {
      errors.push(`${item.path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Embed all new/updated un-embedded chunks for the project.
  const embedResult = await embedProjectChunks(projectId);
  if (embedResult.errors.length > 0) {
    errors.push(...embedResult.errors.map((e) => `embed: ${e}`));
  }

  return { synced, embedded: embedResult.embedded, errors };
}

/** Return GitHub sync status counts for a project. */
export async function getGitHubSyncStatus(projectId: string): Promise<{
  docCount: number;
  lastSyncedAt: Date | null;
}> {
  const result = await prisma.document.aggregate({
    where: { projectId, source: DocSource.GITHUB },
    _count: { id: true },
    _max: { updatedAt: true },
  });
  return {
    docCount: result._count.id,
    lastSyncedAt: result._max.updatedAt,
  };
}
