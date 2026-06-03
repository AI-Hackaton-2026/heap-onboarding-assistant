// GET /api/documents/download?projectId=...&documentId=...
// Returns a short-lived signed download URL for the original stored file.

import { getDownloadUrl } from "@/lib/documents/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const documentId = searchParams.get("documentId");

  if (!projectId || !documentId) {
    return Response.json({ error: "Missing projectId or documentId." }, { status: 400 });
  }

  const url = await getDownloadUrl(projectId, documentId);
  if (!url) {
    return Response.json({ error: "Not found or access denied." }, { status: 404 });
  }

  return Response.json({ url });
}
