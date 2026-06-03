// POST /api/knowledge/generate — embed all un-embedded chunks for a project.
// Admin-gated. Long-running but synchronous for now (hackathon scope);
// returns the result when complete.

export const runtime = "nodejs";

import { requireProjectAdmin } from "@/lib/members/access";
import { embedProjectChunks } from "@/lib/rag/pipeline";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectId =
    body && typeof body === "object" && "projectId" in body
      ? (body as { projectId: unknown }).projectId
      : null;

  if (typeof projectId !== "string" || !projectId) {
    return Response.json({ error: "Missing projectId." }, { status: 400 });
  }

  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return Response.json({ error: "Only project admins can generate embeddings." }, { status: 403 });
  }

  const result = await embedProjectChunks(projectId);

  return Response.json(result, { status: 200 });
}

// GET /api/knowledge/generate?projectId=... — return current embedding progress.
import { getEmbeddingProgress } from "@/lib/rag/pipeline";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "Missing projectId." }, { status: 400 });
  }

  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return Response.json({ error: "Access denied." }, { status: 403 });
  }

  const progress = await getEmbeddingProgress(projectId);
  return Response.json(progress);
}
