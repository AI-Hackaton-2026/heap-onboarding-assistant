// POST /api/github/sync — sync the project's connected GitHub repo into the
// knowledge base (documents → chunks → embeddings). Admin-gated.
// GET /api/github/sync?projectId=... — return sync status (doc count, last sync).

export const runtime = "nodejs";

import { requireProjectAdmin } from "@/lib/members/access";
import { syncGitHubRepo, getGitHubSyncStatus } from "@/lib/github/sync";

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
    return Response.json(
      { error: "Only project admins can sync the repository." },
      { status: 403 },
    );
  }

  try {
    const result = await syncGitHubRepo(projectId);
    return Response.json(result, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

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

  const status = await getGitHubSyncStatus(projectId);
  return Response.json(status);
}
