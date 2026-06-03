// Deterministic text chunker. Splits on sentence / word boundaries where
// possible, targeting ~1000 chars per chunk with ~200-char overlap so adjacent
// chunks share enough context for RAG retrieval.

const CHUNK_SIZE = 1000;
const OVERLAP = 200;

export interface TextChunk {
  index: number;
  content: string;
}

/**
 * Split `text` into ordered, overlapping chunks. Returns an empty array when
 * text is null or blank. The output is stable for the same input, so T-EMB-1
 * can safely re-derive chunk boundaries if needed.
 */
export function chunkText(text: string | null): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    let boundary = end;

    // Walk back to the nearest word boundary to avoid mid-word splits.
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf(" "),
      );
      if (lastBreak > CHUNK_SIZE / 2) {
        boundary = start + lastBreak + 1;
      }
    }

    const content = text.slice(start, boundary).trim();
    if (content.length > 0) {
      chunks.push({ index: chunks.length, content });
    }

    // Advance with overlap so adjacent chunks share context.
    start = Math.max(start + 1, boundary - OVERLAP);
  }

  return chunks;
}
