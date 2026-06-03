// GET /api/documents?projectId=... — list documents for a project.
// Used by the client-side DocumentList component to refresh after mutations.

import { listDocuments } from "@/lib/documents/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "Missing projectId." }, { status: 400 });
  }

  const documents = await listDocuments(projectId);
  return Response.json({ documents });
}
