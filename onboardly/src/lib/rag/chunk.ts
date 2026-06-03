// Re-export from the canonical chunker in src/lib/documents/chunk.ts.
// The RAG pipeline uses document chunks created at upload time, so there is no
// separate chunking step here.
export { chunkText } from "@/lib/documents/chunk";
export type { TextChunk } from "@/lib/documents/chunk";
