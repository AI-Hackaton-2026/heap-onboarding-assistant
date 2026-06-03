// Cross-project onboarding overview aggregation. The dashboard is a single
// global surface, but courses/lessons/progress/documents are all project-scoped,
// so this rolls everything up across every project the current user is an ACTIVE
// member of. Access is enforced here (Prisma bypasses RLS): we only ever read
// data for the caller's own memberships, scoped by their ProjectMember ids.
//
// Net-new vs. the per-project member queries: those derive a roster %, this
// derives the *current user's* % across *all* their projects, plus an aggregated
// plan, recommended reads, and an activity feed.

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/members/access";
import { listAccessibleProjects } from "@/lib/members/queries";
import { createClient } from "@/lib/supabase/server";
import { MemberStatus, ProgressStatus } from "@/generated/prisma/enums";
import type {
  OverviewActivity,
  OverviewData,
  OverviewPlanItem,
  OverviewProgress,
  OverviewRead,
  OverviewUser,
  PlanData,
  PlanProject,
} from "@/types/overview";

const FOCUS_LIMIT = 4;
const STEPS_LIMIT = 6;
const READS_LIMIT = 4;
const ACTIVITY_LIMIT = 6;

/** A user's COMPLETED LessonProgress row (used for progress + activity). */
interface CompletedRow {
  lessonId: string;
  completedAt: Date | null;
}

/** The shared plan build: ordered plan items + the raw completed rows. */
interface PlanBuild {
  planItems: OverviewPlanItem[];
  completedRows: CompletedRow[];
}

/**
 * Fetch the user's lessons across the given projects, ordered by course → module
 * → lesson, tag each completed / up-next, and mark the first not-completed lesson
 * as in-progress. Shared by the overview and the full plan. Access is already
 * established by the caller (projectIds come from listAccessibleProjects).
 */
async function buildPlanItems(
  userId: string,
  projectIds: string[],
  projectNameById: Map<string, string>,
): Promise<PlanBuild> {
  // The caller's ACTIVE ProjectMember rows — progress hangs off member ids.
  const memberships = await prisma.projectMember.findMany({
    where: { userId, projectId: { in: projectIds }, status: MemberStatus.ACTIVE },
    select: { id: true },
  });
  const memberIds = memberships.map((m) => m.id);

  // All lessons across these projects, with project/course/module context.
  // Course has no position field, so we order courses by createdAt.
  const lessons = await prisma.lesson.findMany({
    where: { module: { course: { projectId: { in: projectIds } } } },
    select: {
      id: true,
      title: true,
      position: true,
      module: {
        select: {
          title: true,
          position: true,
          course: {
            select: { title: true, createdAt: true, projectId: true },
          },
        },
      },
    },
  });

  const completedRows: CompletedRow[] =
    memberIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: {
            memberId: { in: memberIds },
            status: ProgressStatus.COMPLETED,
          },
          select: { lessonId: true, completedAt: true },
        })
      : [];
  const completedLessonIds = new Set(completedRows.map((row) => row.lessonId));

  // Stable ordering: course (by creation) → module position → lesson position.
  const orderedLessons = lessons.slice().sort((a, b) => {
    const ca =
      a.module.course.createdAt.getTime() - b.module.course.createdAt.getTime();
    if (ca !== 0) return ca;
    const ma = a.module.position - b.module.position;
    if (ma !== 0) return ma;
    return a.position - b.position;
  });

  const planItems: OverviewPlanItem[] = orderedLessons.map((lesson) => {
    const projectId = lesson.module.course.projectId;
    return {
      id: lesson.id,
      title: lesson.title,
      projectId,
      projectName: projectNameById.get(projectId) ?? "Project",
      courseTitle: lesson.module.course.title,
      moduleTitle: lesson.module.title,
      status: completedLessonIds.has(lesson.id) ? "completed" : "up-next",
      href: `/projects/${projectId}/course`,
    };
  });

  // Mark the first not-completed lesson as "in-progress" (the next thing to do).
  const nextIndex = planItems.findIndex((item) => item.status !== "completed");
  if (nextIndex !== -1) planItems[nextIndex].status = "in-progress";

  return { planItems, completedRows };
}

/** Format an ISO/Date value as "May 14, 2026" for display. */
function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Read a string field from Supabase user_metadata, or null when absent. */
function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Derive a friendly name from an email handle when no display name exists. */
function nameFromEmail(email: string | null): string {
  if (!email) return "there";
  const handle = email.split("@")[0];
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Resolve the signed-in user for the overview banner. */
async function loadOverviewUser(userId: string): Promise<OverviewUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const email = user?.email ?? null;
  const displayName =
    metaString(metadata, "name") ?? metaString(metadata, "full_name");
  return {
    id: userId,
    name: displayName ?? nameFromEmail(email),
    avatarUrl: metaString(metadata, "avatar_url"),
    email,
  };
}

/**
 * Aggregate the current user's onboarding overview across every project they can
 * access. Returns an empty-but-valid shape when unauthenticated or with no data,
 * so the page always renders (empty states handled in the UI).
 */
export async function getOverviewData(): Promise<OverviewData> {
  const userId = await getCurrentUserId();
  if (!userId) return emptyOverview(await safeUser());

  const user = await loadOverviewUser(userId);
  const accessible = await listAccessibleProjects();

  if (accessible.length === 0) {
    return emptyOverview(user);
  }

  const projectIds = accessible.map((entry) => entry.project.id);
  const projectNameById = new Map(
    accessible.map((entry) => [entry.project.id, entry.project.name]),
  );

  const { planItems, completedRows } = await buildPlanItems(
    userId,
    projectIds,
    projectNameById,
  );

  const nextLesson =
    planItems.find((item) => item.status === "in-progress") ?? null;

  const completedCount = planItems.filter(
    (item) => item.status === "completed",
  ).length;
  const totalLessons = planItems.length;
  const progress: OverviewProgress = {
    totalLessons,
    completedLessons: completedCount,
    percent: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
    nextLesson,
  };

  // Focus = the next not-completed lessons; steps = a short timeline slice.
  const focus = planItems
    .filter((item) => item.status !== "completed")
    .slice(0, FOCUS_LIMIT);
  const steps = planItems.slice(0, STEPS_LIMIT);

  // Recommended reads = most recent documents across the projects.
  const documents = await prisma.document.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
    take: READS_LIMIT,
    select: { id: true, title: true, projectId: true, createdAt: true },
  });
  const reads: OverviewRead[] = documents.map((doc) => ({
    id: doc.id,
    title: doc.title ?? "Untitled document",
    projectId: doc.projectId,
    projectName: projectNameById.get(doc.projectId) ?? "Project",
    href: `/dashboard/resources`,
  }));

  // Activity feed = completed lessons + uploaded documents, newest first.
  const activity = buildActivity(completedRows, planItems, documents);

  return {
    user,
    progress,
    focus,
    steps,
    reads,
    activity,
    hasNoProjects: false,
    hasNoCourses: totalLessons === 0,
  };
}

/**
 * The user's full onboarding plan, grouped per project (course order preserved),
 * each project carrying its own completion %. Aggregated across every project the
 * user is an ACTIVE member of. Render-safe empty shape when there's no data.
 */
export async function getPlanData(): Promise<PlanData> {
  const userId = await getCurrentUserId();
  const accessible = userId ? await listAccessibleProjects() : [];

  if (accessible.length === 0) {
    return {
      projects: [],
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
      hasNoProjects: Boolean(userId),
      hasNoCourses: false,
    };
  }

  const projectIds = accessible.map((entry) => entry.project.id);
  const projectNameById = new Map(
    accessible.map((entry) => [entry.project.id, entry.project.name]),
  );

  const { planItems } = await buildPlanItems(
    userId as string,
    projectIds,
    projectNameById,
  );

  // Group plan items by project, preserving course order.
  const groups = new Map<string, OverviewPlanItem[]>();
  for (const item of planItems) {
    const list = groups.get(item.projectId);
    if (list) list.push(item);
    else groups.set(item.projectId, [item]);
  }

  // Build a PlanProject per accessible project that actually has lessons.
  const projects: PlanProject[] = [];
  for (const { project } of accessible) {
    const items = groups.get(project.id);
    if (!items || items.length === 0) continue;
    const completed = items.filter((i) => i.status === "completed").length;
    projects.push({
      projectId: project.id,
      projectName: project.name,
      courseTitle: items[0].courseTitle,
      items,
      completedLessons: completed,
      totalLessons: items.length,
      percent: Math.round((completed / items.length) * 100),
      href: `/projects/${project.id}/course`,
    });
  }

  const totalLessons = planItems.length;
  const completedLessons = planItems.filter(
    (i) => i.status === "completed",
  ).length;

  return {
    projects,
    totalLessons,
    completedLessons,
    percent:
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    hasNoProjects: false,
    hasNoCourses: projects.length === 0,
  };
}

/** Build the merged, date-sorted recent-activity feed. */
function buildActivity(
  completedRows: CompletedRow[],
  planItems: OverviewPlanItem[],
  documents: { id: string; title: string | null; createdAt: Date }[],
): OverviewActivity[] {
  const lessonTitleById = new Map(planItems.map((l) => [l.id, l.title]));
  const items: OverviewActivity[] = [];

  for (const row of completedRows) {
    if (!row.completedAt) continue;
    items.push({
      id: `lesson-${row.lessonId}`,
      text: `Completed “${lessonTitleById.get(row.lessonId) ?? "a lesson"}”`,
      date: formatDate(row.completedAt),
      timestamp: row.completedAt.toISOString(),
      status: "completed",
    });
  }
  for (const doc of documents) {
    items.push({
      id: `doc-${doc.id}`,
      text: `Added “${doc.title ?? "a document"}”`,
      date: formatDate(doc.createdAt),
      timestamp: doc.createdAt.toISOString(),
      status: "in-progress",
    });
  }

  return items
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, ACTIVITY_LIMIT);
}

/** A best-effort user shape when we can't fully resolve (unauthenticated). */
async function safeUser(): Promise<OverviewUser> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const metadata = user?.user_metadata as Record<string, unknown> | undefined;
    const email = user?.email ?? null;
    return {
      id: user?.id ?? "",
      name:
        metaString(metadata, "name") ??
        metaString(metadata, "full_name") ??
        nameFromEmail(email),
      avatarUrl: metaString(metadata, "avatar_url"),
      email,
    };
  } catch {
    return { id: "", name: "there", avatarUrl: null, email: null };
  }
}

/** The empty overview shape (valid, render-safe) for no-data cases. */
function emptyOverview(user: OverviewUser): OverviewData {
  return {
    user,
    progress: {
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
      nextLesson: null,
    },
    focus: [],
    steps: [],
    reads: [],
    activity: [],
    hasNoProjects: true,
    hasNoCourses: false,
  };
}
