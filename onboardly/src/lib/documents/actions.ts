"use server";

// Document write actions — upload and delete. Both are admin-gated.
// The upload action is called from the API route (multipart form); deleteDocument
// is a server action called directly from the DocumentRow component.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireProjectAdmin } from "@/lib/members/access";
import { uploadFile, deleteFile } from "@/lib/supabase/storage";
import { validateFile, extractText } from "@/lib/documents/parse";
import { chunkText } from "@/lib/documents/chunk";
import { DocSource } from "@/generated/prisma/enums";

export type DocumentActionResult =
  | { ok: true; documentId: string }
  | { ok: false; error: string };

export type DeleteDocumentResult = { ok: true } | { ok: false; error: string };

/**
 * Upload a document to Storage, parse its text, chunk it, and persist all rows.
 * Returns the new Document id on success. Cleans up Storage on failure after
 * the file has already been uploaded.
 */
export async function uploadDocument(
  projectId: string,
  filename: string,
  mimeType: string,
  buffer: Buffer,
): Promise<DocumentActionResult> {
  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return { ok: false, error: "Only project admins can upload documents." };
  }

  const validation = validateFile(filename, mimeType, buffer.length);
  if (!validation.ok) return { ok: false, error: validation.error };

  // Upload the original file first so we have the storage path.
  let storagePath: string;
  try {
    storagePath = await uploadFile(projectId, filename, buffer, mimeType);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Upload failed: ${msg}` };
  }

  // Extract text (non-fatal — document is still created with rawText = null).
  const rawText = await extractText(buffer, mimeType, filename);
  const title = filename.replace(/\.[^.]+$/, "");
  const chunks = chunkText(rawText);

  try {
    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          projectId,
          source: DocSource.UPLOAD,
          title,
          storagePath,
          mimeType,
          rawText,
          metadata: { originalFilename: filename, size: buffer.length },
        },
      });

      if (chunks.length > 0) {
        await tx.documentChunk.createMany({
          data: chunks.map((c) => ({
            documentId: doc.id,
            chunkIndex: c.index,
            content: c.content,
            citation: `Upload: ${title}#chunk${c.index}`,
          })),
        });
      }

      return doc;
    });

    revalidatePath(`/projects/${projectId}/documents`);
    return { ok: true, documentId: document.id };
  } catch (e) {
    // Cleanup the orphaned Storage object so we don't leak files.
    await deleteFile(storagePath).catch(() => undefined);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to save document: ${msg}` };
  }
}

/**
 * Delete a document: remove the Storage object and let the FK cascade handle
 * the DocumentChunk rows. Admin-only.
 */
export async function deleteDocument(
  projectId: string,
  documentId: string,
): Promise<DeleteDocumentResult> {
  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return { ok: false, error: "Only project admins can delete documents." };
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, projectId },
    select: { id: true, storagePath: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };

  // Delete Storage object first; then the DB row (cascade removes chunks).
  if (doc.storagePath) {
    await deleteFile(doc.storagePath).catch(() => undefined);
  }

  await prisma.document.delete({ where: { id: doc.id } });

  revalidatePath(`/projects/${projectId}/documents`);
  return { ok: true };
}
