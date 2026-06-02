// POST /api/course/generate
// Accepts { projectId, roleName, githubRepo }, runs the Gemini course generator,
// and returns the full Course JSON.

import { NextRequest } from "next/server";
import { generateCourse } from "@/lib/course/generate";

interface GenerateRequest {
  projectId?: string;
  roleName: string;
  githubRepo: string;
}

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, roleName, githubRepo } = body;

  if (!roleName?.trim()) {
    return Response.json({ error: "roleName is required" }, { status: 400 });
  }
  if (!githubRepo?.trim()) {
    return Response.json({ error: "githubRepo is required" }, { status: 400 });
  }

  try {
    const course = await generateCourse(
      projectId ?? "",
      roleName.trim(),
      githubRepo.trim(),
    );
    return Response.json(course);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Course generation failed";
    console.error("[course/generate]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
