// Server-only text extraction. Node runtime required — never import from Edge
// or client components. Each parser returns the full extracted text, or null
// when the file yields nothing useful.

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
  "text/plain",
  "text/x-markdown",
]);

const ACCEPTED_EXTENSIONS = new Set([".pdf", ".docx", ".md", ".txt"]);

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Validate that this file is accepted by extension AND MIME type. */
export function validateFile(
  filename: string,
  mimeType: string,
  size: number,
): { ok: true } | { ok: false; error: string } {
  if (size > MAX_FILE_SIZE) {
    return { ok: false, error: "File exceeds the 10 MB limit." };
  }
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `Unsupported file type "${ext}". Accepted: PDF, DOCX, MD, TXT.`,
    };
  }
  // Normalise browser MIME quirks: some browsers send generic types for .md/.txt
  const normMime = mimeType.split(";")[0].trim().toLowerCase();
  const isTextLike =
    normMime.startsWith("text/") || normMime === "application/octet-stream";
  if (!ACCEPTED_MIME_TYPES.has(normMime) && !isTextLike) {
    return {
      ok: false,
      error: `MIME type "${mimeType}" is not accepted for this file.`,
    };
  }
  return { ok: true };
}

/**
 * Extract raw text from a file buffer. Returns null when the file is valid but
 * yields no extractable text (e.g. a scanned-image PDF). Never throws for
 * extraction failures — callers should surface a notice but not fail the upload.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string | null> {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";

  try {
    if (ext === ".pdf" || mimeType === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result.text.trim();
      return text.length > 0 ? text : null;
    }

    if (
      ext === ".docx" ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      return text.length > 0 ? text : null;
    }

    // MD and TXT — read as UTF-8, keep raw
    const text = buffer.toString("utf-8").trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
