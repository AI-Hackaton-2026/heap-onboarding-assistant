// GET  /api/course/[projectId]/progress — returns completed lesson IDs for the current user
// POST /api/course/[projectId]/progress — marks a lesson as COMPLETED (upserts ProjectMember if needed)

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { ProgressStatus, MemberSource, MemberStatus } from "@/generated/prisma/enums";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
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
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  let body: { lessonId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lessonId } = body;
  if (!lessonId) return Response.json({ error: "lessonId is required" }, { status: 400 });

  const member = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: user.id } },
    create: {
      projectId,
      userId: user.id,
      source: MemberSource.MANUAL,
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
    },
    update: {},
    select: { id: true },
  });

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
