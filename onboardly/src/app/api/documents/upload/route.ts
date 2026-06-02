// Placeholder API route for uploaded document handling.
// Future responsibility:
//   Upload docs (PDF/MD/DOCX/TXT) → extract text → store document content
//   → prepare for embeddings.

export async function POST() {
  return Response.json({ message: "Document upload placeholder" });
}
