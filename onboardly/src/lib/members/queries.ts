// Member reads — the project roster, the cross-org "projects I can see" union,
// and the derived onboarding %. All scoping/role logic lives here (Prisma
// bypasses RLS). Onboarding % is *always* derived from LessonProgress vs. the
// project's total lessons — never stored — and is null ("Not started") until a
// course with lessons exists (Phases 8–10), so this stays stub-safe today.

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/members/access";
import { ProjectRole, MemberStatus, ProgressStatus } from "@/generated/prisma/enums";
import type { AccessibleProject, RosterMember } from "@/types/member";

/**
 * Count the total lessons in a project (across all its courses/modules). This is
 * the denominator for onboarding %. Zero today (no course yet) ⇒ % is null.
 */
async function countProjectLessons(projectId: string): Promise<number> {
  return prisma.lesson.count({
    where: { module: { course: { projectId } } },
  });
}

/**
 * Derive a member's onboarding completion %, 0–100, or null when there's nothing
 * to measure yet (no lessons in the project). Never divides by zero; never reads
 * a stored percent. `completedCount` is that member's COMPLETED LessonProgress
 * rows, `totalLessons` the project-wide lesson count.
 */
export function computeOnboardingPercent(
  completedCount: number,
  totalLessons: number,
): number | null {
  if (totalLessons <= 0) return null;
  return Math.round((completedCount / totalLessons) * 100);
}

/**
 * The ACTIVE roster for a project, each row carrying a derived onboarding %.
 * Soft-deleted (REMOVED) members are filtered out. Sorted admins-first, then by
 * join time. Caller is responsible for the access check (this is a plain read).
 */
export async function listMembers(projectId: string): Promise<RosterMember[]> {
  const totalLessons = await countProjectLessons(projectId);

  const members = await prisma.projectMember.findMany({
    where: { projectId, status: MemberStatus.ACTIVE },
    include: {
      _count: {
        select: { progress: { where: { status: ProgressStatus.COMPLETED } } },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }, { createdAt: "asc" }],
  });

  // ProjectMember snapshots identity at add-time, but back-filled/owner rows can
  // have null fields (created before a UserProfile existed). Fall back to the
  // live UserProfile so the roster never shows "Unknown" for a real user.
  const profiles = await prisma.userProfile.findMany({
    where: { userId: { in: members.map((m) => m.userId) } },
  });
  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

  return members.map((m) => {
    const profile = profileByUserId.get(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      email: m.email ?? profile?.email ?? null,
      githubLogin: m.githubLogin ?? profile?.githubLogin ?? null,
      displayName: m.displayName ?? profile?.displayName ?? null,
      avatarUrl: m.avatarUrl ?? profile?.avatarUrl ?? null,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt?.toISOString() ?? null,
      onboardingPercent: computeOnboardingPercent(
        m._count.progress,
        totalLessons,
      ),
    };
  });
}

/**
 * Every project the current user can see, tagged with their effective role:
 * the union of (a) projects in orgs they own ⇒ ADMIN, and (b) projects where
 * they're an ACTIVE member ⇒ their stored role. Membership grants visibility of
 * that one project only — never the rest of the foreign org. Most-recently-
 * updated first. Empty when unauthenticated.
 */
export async function listAccessibleProjects(): Promise<AccessibleProject[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // (a) Owned projects — caller owns the org ⇒ ADMIN on all of them.
  const owned = await prisma.project.findMany({
    where: { organization: { ownerId: userId } },
    orderBy: { updatedAt: "desc" },
  });
  const ownedIds = new Set(owned.map((p) => p.id));

  // (b) Projects the caller is an ACTIVE member of (may live in other orgs).
  const memberships = await prisma.projectMember.findMany({
    where: { userId, status: MemberStatus.ACTIVE },
    include: { project: true },
  });

  const byId = new Map<string, AccessibleProject>();
  for (const project of owned) {
    byId.set(project.id, { project, role: ProjectRole.ADMIN });
  }
  for (const m of memberships) {
    // Owned projects already counted as ADMIN — don't downgrade them.
    if (ownedIds.has(m.projectId)) continue;
    byId.set(m.projectId, { project: m.project, role: m.role });
  }

  return [...byId.values()].sort(
    (a, b) => b.project.updatedAt.getTime() - a.project.updatedAt.getTime(),
  );
}
