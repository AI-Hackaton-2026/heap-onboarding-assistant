// POST /api/slack/sync — sync Slack data into the knowledge base. Admin-gated.
// GET  /api/slack/sync?projectId=... — return sync status.

export const runtime = "nodejs";

import { requireProjectAdmin } from "@/lib/members/access";
import { syncSlack, getSlackSyncStatus } from "@/lib/slack/sync";

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
      { error: "Only project admins can sync Slack." },
      { status: 403 },
    );
  }

  try {
    const result = await syncSlack(projectId);
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Slack sync failed.";
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

  const status = await getSlackSyncStatus(projectId);
  return Response.json(status);
}
