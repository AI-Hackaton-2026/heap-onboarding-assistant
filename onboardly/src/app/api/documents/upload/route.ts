// Multipart document upload route. Validates the file, delegates to
// uploadDocument, and returns a clear JSON response. Node runtime required —
// parsing relies on pdf-parse / mammoth which are Node-only.

export const runtime = "nodejs";

import { uploadDocument } from "@/lib/documents/actions";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const projectId = formData.get("projectId");
  const file = formData.get("file");

  if (typeof projectId !== "string" || !projectId) {
    return Response.json({ error: "Missing projectId." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing or invalid file." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await uploadDocument(
    projectId,
    file.name,
    file.type || "application/octet-stream",
    buffer,
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ documentId: result.documentId }, { status: 201 });
}
