// PUT    /api/course/[projectId] — save admin edits to the project's course.
// DELETE /api/course/[projectId] — remove the saved course so it can regenerate.

import { NextRequest } from "next/server";
import { deleteCourseFromDb, upsertCourse } from "@/lib/course/db";
import { parseCourse } from "@/lib/course/schema";
import { requireProjectAdmin } from "@/lib/members/access";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return Response.json(
      { error: "Only project admins can edit the course." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const course = parseCourse(body);
  if (!course) {
    return Response.json({ error: "Invalid course payload" }, { status: 400 });
  }

  try {
    await upsertCourse(projectId, course);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    console.error("[course/PUT]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return Response.json(
      { error: "Only project admins can delete the course." },
      { status: 403 },
    );
  }

  try {
    await deleteCourseFromDb(projectId);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    console.error("[course/DELETE]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
