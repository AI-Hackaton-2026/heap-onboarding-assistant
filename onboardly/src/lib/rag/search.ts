// pgvector similarity search over the embeddings table.
// Uses raw SQL because Prisma does not support the <=> cosine-distance operator.

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { embedQuery } from "./embeddings";

export interface KnowledgeChunk {
  id: string;
  content: string;
  sourceLabel: string;
  distance: number;
}

/**
 * Embed `query`, run pgvector similarity search scoped to `projectId`,
 * and return the top-k nearest chunks.
 *
 * Returns an empty array when no embeddings exist for the project — callers
 * must handle this gracefully rather than erroring.
 */
export async function searchKnowledge(
  query: string,
  projectId: string,
  topK = 5,
): Promise<KnowledgeChunk[]> {
  const vector = await embedQuery(query);
  // pgvector expects a Postgres literal like '[0.1,0.2,...]', not a JS array.
  const vectorLiteral = `[${vector.join(",")}]`;

  type Row = { id: string; content: string; source_label: string; distance: number };

  const rows = await prisma.$queryRaw<Row[]>(
    Prisma.sql`
      SELECT id, content, source_label, embedding <=> ${vectorLiteral}::vector AS distance
      FROM embeddings
      WHERE project_id = ${projectId}::uuid
      ORDER BY distance
      LIMIT ${topK}
    `,
  );

  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    sourceLabel: r.source_label,
    distance: r.distance,
  }));
}
