// Placeholder document ingestion helper.
// Future responsibility:
//   Accept uploaded docs (PDF/Markdown/DOCX/TXT) → extract raw text
//   → store original file + parsed content → prepare for chunking/embeddings.

export async function ingestDocument(_file: File): Promise<void> {
  throw new Error("Document ingestion not implemented yet");
}
