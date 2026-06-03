// Fetches document chunks stored in the project knowledge base to use as
// additional context when generating a course.

import { prisma } from "@/lib/db/prisma";

const MAX_CHUNKS = 30;
const MAX_TOTAL_CHARS = 20_000;

export async function fetchProjectChunks(projectId: string): Promise<string> {
  const chunks = await prisma.documentChunk.findMany({
    where: { document: { projectId } },
    select: { content: true, citation: true },
    take: MAX_CHUNKS,
    orderBy: { createdAt: "asc" },
  });

  if (chunks.length === 0) return "";

  const parts: string[] = [];
  let total = 0;

  for (const chunk of chunks) {
    if (total >= MAX_TOTAL_CHARS) break;
    const text = `[${chunk.citation}]\n${chunk.content}`;
    parts.push(text);
    total += text.length;
  }

  return `# Project Documentation\n\n${parts.join("\n\n---\n\n")}`;
}
