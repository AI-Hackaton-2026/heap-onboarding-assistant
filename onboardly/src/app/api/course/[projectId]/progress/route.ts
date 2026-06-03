// GET  /api/course/[projectId]/progress — returns completed lesson IDs for the current user
// POST /api/course/[projectId]/progress — marks a lesson as COMPLETED
//
// Both require an ACTIVE project membership (via getProjectAccess). Progress is
// never a path to self-enrollment: the caller must already be a member, and the
// lesson must belong to a course in this project.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId, getProjectAccess } from "@/lib/members/access";
import { ProgressStatus } from "@/generated/prisma/enums";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  const access = await getProjectAccess(projectId);
  if (!access) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const userId = await getCurrentUserId();
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: userId! } },
    select: { id: true },
  });

  if (!member) return Response.json({ completedLessonIds: [] });

  const rows = await prisma.lessonProgress.findMany({
    where: { memberId: member.id, status: ProgressStatus.COMPLETED },
    select: { lessonId: true },
  });

  return Response.json({ completedLessonIds: rows.map((r) => r.lessonId) });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;

  const access = await getProjectAccess(projectId);
  if (!access) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  let body: { lessonId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonId } = body;
  if (!lessonId) {
    return Response.json({ error: "lessonId is required" }, { status: 400 });
  }

  // The lesson must belong to a course in this project — prevents marking
  // lessons from other projects, which would corrupt onboarding metrics.
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { course: { projectId } } },
    select: { id: true },
  });
  if (!lesson) {
    return Response.json(
      { error: "Lesson does not belong to this project" },
      { status: 404 },
    );
  }

  const userId = await getCurrentUserId();
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: userId! } },
    select: { id: true },
  });
  if (!member) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.lessonProgress.upsert({
    where: { lessonId_memberId: { lessonId, memberId: member.id } },
    create: {
      lessonId,
      memberId: member.id,
      status: ProgressStatus.COMPLETED,
      completedAt: new Date(),
    },
    update: {
      status: ProgressStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  return Response.json({ ok: true });
}
