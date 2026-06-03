// DELETE /api/course/[projectId]
// Removes the saved course for a project so the user can regenerate.

import { NextRequest } from "next/server";
import { deleteCourseFromDb } from "@/lib/course/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    await deleteCourseFromDb(projectId);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
