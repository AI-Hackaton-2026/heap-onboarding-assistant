// Embedding pipeline for T-EMB-1.
// Finds all DocumentChunk rows for a project that have no embedding yet,
// embeds them in batches via Gemini, and upserts the vectors into pgvector.
//
// Raw SQL is required for writes because Prisma marks the embedding column as
// Unsupported("vector(768)") and cannot generate typed queries for it.

import { prisma } from "@/lib/db/prisma";
import { embedChunks } from "@/lib/rag/embeddings";

const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

/** Parse the retry-after seconds from a Gemini 429 error message. */
function parseRetryDelay(msg: string): number {
  const match = msg.match(/retry[^\d]*(\d+(?:\.\d+)?)s/i);
  return match ? Math.ceil(parseFloat(match[1])) + 2 : 60;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Embed a batch with automatic retry on 429 rate-limit responses. */
async function embedWithRetry(texts: string[]): Promise<number[][]> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await embedChunks(texts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
      if (is429 && attempt < MAX_RETRIES - 1) {
        const delaySecs = parseRetryDelay(msg);
        await sleep(delaySecs * 1000);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Max retries exceeded");
}

export interface EmbedResult {
  embedded: number;
  skipped: number;
  total: number;
  errors: string[];
}

/**
 * Embed all un-embedded DocumentChunk rows for a project and store the vectors
 * in the embeddings table. Already-embedded chunks are skipped. Safe to call
 * multiple times — fully idempotent.
 */
export async function embedProjectChunks(projectId: string): Promise<EmbedResult> {
  // Fetch all chunks for the project that have no embedding row yet.
  const chunks = await prisma.$queryRaw<{ id: string; content: string }[]>`
    SELECT dc.id, dc.content
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    LEFT JOIN embeddings e ON e.chunk_id = dc.id
    WHERE d.project_id = ${projectId}::uuid
      AND e.chunk_id IS NULL
    ORDER BY dc.created_at, dc.chunk_index
  `;

  const total = chunks.length;
  let embedded = 0;
  const errors: string[] = [];

  // Process in batches to stay within Gemini API limits.
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    let vectors: number[][];
    try {
      vectors = await embedWithRetry(texts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`);
      continue;
    }

    // Upsert each vector with a raw SQL INSERT … ON CONFLICT DO UPDATE.
    // The ::vector cast is required by pgvector.
    for (let j = 0; j < batch.length; j++) {
      const chunkId = batch[j].id;
      const vector = `[${vectors[j].join(",")}]`;
      try {
        await prisma.$executeRaw`
          INSERT INTO embeddings (chunk_id, embedding)
          VALUES (${chunkId}::uuid, ${vector}::vector)
          ON CONFLICT (chunk_id) DO UPDATE SET embedding = EXCLUDED.embedding
        `;
        embedded++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Chunk ${chunkId}: ${msg}`);
      }
    }
  }

  const alreadyEmbedded = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM embeddings e
    JOIN document_chunks dc ON dc.id = e.chunk_id
    JOIN documents d ON d.id = dc.document_id
    WHERE d.project_id = ${projectId}::uuid
  `;
  const skipped = Number(alreadyEmbedded[0]?.count ?? 0) - embedded;

  return { embedded, skipped: Math.max(0, skipped), total, errors };
}

/** Count how many chunks have embeddings vs total for a project. */
export async function getEmbeddingProgress(projectId: string): Promise<{
  embedded: number;
  total: number;
}> {
  const rows = await prisma.$queryRaw<{ embedded: bigint; total: bigint }[]>`
    SELECT
      COUNT(e.chunk_id)::bigint AS embedded,
      COUNT(dc.id)::bigint AS total
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    LEFT JOIN embeddings e ON e.chunk_id = dc.id
    WHERE d.project_id = ${projectId}::uuid
  `;
  return {
    embedded: Number(rows[0]?.embedded ?? 0),
    total: Number(rows[0]?.total ?? 0),
  };
}
