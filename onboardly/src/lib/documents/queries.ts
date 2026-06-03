// Document read helpers. All queries are scoped through getProjectAccess so
// only ACTIVE members can see results. Admins get additional actions elsewhere.

import { prisma } from "@/lib/db/prisma";
import { getProjectAccess } from "@/lib/members/access";
import { getSignedUrl } from "@/lib/supabase/storage";

export interface DocumentSummary {
  id: string;
  title: string | null;
  mimeType: string | null;
  storagePath: string | null;
  chunkCount: number;
  hasText: boolean;
  createdAt: Date;
}

/**
 * List all documents for a project. Returns an empty array when the caller has
 * no ACTIVE membership (rather than throwing, so pages render gracefully).
 */
export async function listDocuments(
  projectId: string,
): Promise<DocumentSummary[]> {
  const access = await getProjectAccess(projectId);
  if (!access) return [];

  const docs = await prisma.document.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      mimeType: true,
      storagePath: true,
      rawText: true,
      createdAt: true,
      _count: { select: { chunks: true } },
    },
  });

  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    mimeType: doc.mimeType,
    storagePath: doc.storagePath,
    chunkCount: doc._count.chunks,
    hasText: doc.rawText !== null,
    createdAt: doc.createdAt,
  }));
}

/**
 * Generate a short-lived signed download URL for a document. Returns null when
 * the caller has no access or the document has no stored file.
 */
export async function getDownloadUrl(
  projectId: string,
  documentId: string,
): Promise<string | null> {
  const access = await getProjectAccess(projectId);
  if (!access) return null;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, projectId },
    select: { storagePath: true },
  });
  if (!doc?.storagePath) return null;

  try {
    return await getSignedUrl(doc.storagePath);
  } catch {
    return null;
  }
}
