// Placeholder embedding generation helper.
// Future responsibility: embed chunks via Gemini Embeddings and store the
// vectors in Supabase pgvector with their source citation.

export async function embedChunks(_chunks: string[]): Promise<number[][]> {
  throw new Error("Embeddings not implemented yet");
}
