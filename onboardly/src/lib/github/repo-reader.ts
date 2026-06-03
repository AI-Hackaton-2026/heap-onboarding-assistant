// Reads a GitHub repository's structure and key file contents to build LLM context.
// Uses GITHUB_TOKEN (PAT) — no GitHub App required.

const GITHUB_API = "https://api.github.com";

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
  "vendor",
  "__pycache__",
  ".cache",
]);

const INCLUDED_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".sh",
]);

const MAX_FILES = 20;
const MAX_TOTAL_BYTES = 40_000;
const MAX_FILE_BYTES = 8_000;

interface TreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

interface TreeResponse {
  tree: TreeItem[];
  truncated?: boolean;
}

interface FileResponse {
  content?: string;
  encoding?: string;
}

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function shouldInclude(path: string, size?: number): boolean {
  if (size && size > MAX_FILE_BYTES) return false;
  const parts = path.split("/");
  if (parts.some((p) => EXCLUDED_DIRS.has(p))) return false;
  const lower = path.toLowerCase();
  if (lower.includes("readme")) return true;
  const dotIdx = path.lastIndexOf(".");
  if (dotIdx === -1) return false;
  return INCLUDED_EXTENSIONS.has(path.slice(dotIdx).toLowerCase());
}

export async function fetchRepoContext(githubRepo: string): Promise<string> {
  const parts = githubRepo.trim().split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repo format: "${githubRepo}". Use owner/repo.`);
  }
  const [owner, repo] = parts;
  const headers = authHeaders();
  const base = `${GITHUB_API}/repos/${owner}/${repo}`;

  const treeRes = await fetch(`${base}/git/trees/HEAD?recursive=1`, { headers });
  if (!treeRes.ok) {
    const body = await treeRes.text();
    throw new Error(`GitHub tree fetch failed (${treeRes.status}): ${body}`);
  }
  const treeData = (await treeRes.json()) as TreeResponse;

  const candidates = treeData.tree
    .filter((item) => item.type === "blob" && shouldInclude(item.path, item.size))
    .sort((a, b) => {
      const aIsReadme = a.path.toLowerCase().includes("readme");
      const bIsReadme = b.path.toLowerCase().includes("readme");
      if (aIsReadme !== bIsReadme) return aIsReadme ? -1 : 1;
      return a.path.split("/").length - b.path.split("/").length;
    })
    .slice(0, MAX_FILES);

  const fileParts: string[] = [];
  let totalBytes = 0;

  for (const item of candidates) {
    if (totalBytes >= MAX_TOTAL_BYTES) break;
    const fileRes = await fetch(`${base}/contents/${item.path}`, { headers });
    if (!fileRes.ok) continue;
    const fileData = (await fileRes.json()) as FileResponse;
    if (!fileData.content || fileData.encoding !== "base64") continue;
    const content = Buffer.from(fileData.content.replace(/\n/g, ""), "base64").toString("utf-8");
    const truncated = content.slice(0, MAX_FILE_BYTES);
    totalBytes += truncated.length;
    fileParts.push(`### ${item.path}\n\`\`\`\n${truncated}\n\`\`\``);
  }

  return `# Repository: ${githubRepo}\n\n${fileParts.join("\n\n")}`;
}
