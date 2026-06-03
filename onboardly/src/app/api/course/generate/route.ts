// POST /api/course/generate
// Accepts { projectId, roleName, githubRepo }, fetches document chunks,
// runs the Gemini course generator, saves to DB, and returns the course JSON.
//
// Generating persists one course per project (overwriting any existing one), so
// it's an admin-only setup action — gated by requireProjectAdmin.

import { NextRequest } from "next/server";
import { generateCourse } from "@/lib/course/generate";
import { saveCourseToDb } from "@/lib/course/db";
import { fetchProjectChunks } from "@/lib/course/chunks";
import { requireProjectAdmin } from "@/lib/members/access";

const MAX_ROLE_LENGTH = 100;

interface GenerateRequest {
  projectId?: string;
  roleName: string;
  githubRepo?: string;
}

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, roleName, githubRepo } = body;

  if (!projectId?.trim()) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!roleName?.trim()) {
    return Response.json({ error: "roleName is required" }, { status: 400 });
  }
  if (roleName.trim().length > MAX_ROLE_LENGTH) {
    return Response.json(
      { error: `roleName must be ${MAX_ROLE_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return Response.json(
      { error: "Only project admins can generate the course." },
      { status: 403 },
    );
  }

  try {
    const docsContext = await fetchProjectChunks(projectId);

    const course = await generateCourse(
      projectId,
      roleName.trim(),
      githubRepo?.trim() || undefined,
      docsContext || undefined,
    );

    await saveCourseToDb(projectId, course);

    return Response.json(course);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Course generation failed";
    console.error("[course/generate]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
