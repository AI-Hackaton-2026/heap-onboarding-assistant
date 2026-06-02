// Placeholder API route for generating the knowledge base.
// Future responsibility:
//   Chunk documents → generate embeddings → store vectors in Supabase pgvector
//   → generate project knowledge graph.

export async function POST() {
  return Response.json({ message: "Knowledge generation placeholder" });
}
