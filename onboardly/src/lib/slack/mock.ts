// Mock Slack sync pipeline. Converts mock channel data into Document rows,
// chunks them, and embeds them — identical downstream path to real Slack sync.
// Swap MOCK_CHANNELS for real Slack API calls when T-SLACK-1 is implemented.

import { prisma } from "@/lib/db/prisma";
import { chunkText } from "@/lib/documents/chunk";
import { embedProjectChunks } from "@/lib/rag/pipeline";
import { DocSource, Provider, ConnectionStatus } from "@/generated/prisma/enums";
import { MOCK_CHANNELS, MOCK_WORKSPACE_NAME } from "@/data/mock/slack";

export interface SlackSyncResult {
  channels: number;
  embedded: number;
  errors: string[];
}

/**
 * Sync mock Slack data into the knowledge base for a project.
 * Creates/updates one Document per channel (source=SLACK) and embeds all chunks.
 * Idempotent — re-running updates existing rows.
 */
export async function syncSlackMock(projectId: string): Promise<SlackSyncResult> {
  const errors: string[] = [];
  let channels = 0;

  // Upsert a SLACK project_connection row so the UI shows "Connected".
  await prisma.projectConnection.upsert({
    where: { projectId_provider: { projectId, provider: Provider.SLACK } },
    create: {
      projectId,
      provider: Provider.SLACK,
      externalRef: MOCK_WORKSPACE_NAME,
      status: ConnectionStatus.CONNECTED,
      connectedAt: new Date(),
    },
    update: {
      status: ConnectionStatus.CONNECTED,
      externalRef: MOCK_WORKSPACE_NAME,
      connectedAt: new Date(),
    },
  });

  for (const channel of MOCK_CHANNELS) {
    try {
      // Build a readable summary of the channel: purpose + all messages.
      const lines = [
        `# Slack channel: #${channel.name}`,
        `Purpose: ${channel.purpose}`,
        "",
        ...channel.messages.map(
          (m) => `[${new Date(m.ts).toLocaleDateString()}] ${m.user}: ${m.text}`,
        ),
      ];
      const rawText = lines.join("\n");
      const title = `Slack: #${channel.name}`;
      const sourceRef = `slack-channel-${channel.id}`;
      const chunks = chunkText(rawText);

      const existing = await prisma.document.findFirst({
        where: { projectId, source: DocSource.SLACK, sourceRef },
        select: { id: true },
      });

      await prisma.$transaction(async (tx) => {
        let docId: string;
        if (existing) {
          await tx.document.update({
            where: { id: existing.id },
            data: { rawText, title },
          });
          await tx.documentChunk.deleteMany({ where: { documentId: existing.id } });
          docId = existing.id;
        } else {
          const doc = await tx.document.create({
            data: {
              projectId,
              source: DocSource.SLACK,
              title,
              sourceRef,
              mimeType: "text/plain",
              rawText,
              metadata: { workspace: MOCK_WORKSPACE_NAME, channel: channel.name },
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
              citation: `Slack: #${channel.name}#chunk${c.index}`,
            })),
          });
        }
      });

      channels++;
    } catch (e) {
      errors.push(`#${channel.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const embedResult = await embedProjectChunks(projectId);
  if (embedResult.errors.length > 0) {
    errors.push(...embedResult.errors.map((e) => `embed: ${e}`));
  }

  return { channels, embedded: embedResult.embedded, errors };
}

/** Return Slack sync status for a project. */
export async function getSlackSyncStatus(projectId: string): Promise<{
  channelCount: number;
  lastSyncedAt: Date | null;
  workspaceName: string | null;
}> {
  const [result, connection] = await Promise.all([
    prisma.document.aggregate({
      where: { projectId, source: DocSource.SLACK },
      _count: { id: true },
      _max: { updatedAt: true },
    }),
    prisma.projectConnection.findUnique({
      where: { projectId_provider: { projectId, provider: Provider.SLACK } },
      select: { externalRef: true, status: true },
    }),
  ]);

  return {
    channelCount: result._count.id,
    lastSyncedAt: result._max.updatedAt,
    workspaceName:
      connection?.status === ConnectionStatus.CONNECTED
        ? (connection.externalRef ?? null)
        : null,
  };
}
