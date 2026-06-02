// Placeholder vector search helper.
// Future responsibility: embed a user question and run a pgvector similarity
// search, returning the top-k most relevant chunks (with source citations).

import type { Citation } from "@/types/chat";

export interface RetrievedChunk {
  text: string;
  citation: Citation;
  score: number;
}

export async function searchKnowledge(
  _query: string,
  _topK = 5,
): Promise<RetrievedChunk[]> {
  throw new Error("Vector search not implemented yet");
}
