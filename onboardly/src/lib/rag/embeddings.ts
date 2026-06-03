// Embedding generation via gemini-embedding-001 truncated to 768 dims.

import { getGemini, GEMINI_EMBEDDING_MODEL } from "@/lib/ai/gemini";

/** Embed a single query string; returns the 768-dim float vector. */
export async function embedQuery(text: string): Promise<number[]> {
  const ai = getGemini();
  const result = await ai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: 768 },
  });
  const values = result.embeddings?.[0]?.values;
  if (!values) throw new Error("Gemini embedContent returned no values");
  return values;
}

/** Embed multiple text chunks; returns one vector per chunk (same order). */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const ai = getGemini();
  const result = await ai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: chunks,
    config: { outputDimensionality: 768 },
  });
  const embeddings = result.embeddings;
  if (!embeddings || embeddings.length !== chunks.length) {
    throw new Error("Gemini embedContent returned unexpected number of embeddings");
  }
  return embeddings.map((e) => {
    if (!e.values) throw new Error("Gemini embedding missing values");
    return e.values;
  });
}
