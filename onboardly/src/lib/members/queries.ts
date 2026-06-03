// Member reads — the project roster, accessible projects, and derived
// onboarding %. All scoping/role logic lives here because Prisma bypasses RLS.
// Onboarding % is derived from LessonProgress vs. the project's total lessons;
// it is null ("Not started") until a course with lessons exists.

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId, getProjectAccess } from "@/lib/members/access";
import {
  MemberStatus,
  ProgressStatus,
  Provider,
} from "@/generated/prisma/enums";
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
 * join time. Returns an empty list when the caller cannot access the project.
 */
export async function listMembers(projectId: string): Promise<RosterMember[]> {
  if (!(await getProjectAccess(projectId))) return [];

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

  // ProjectMember snapshots identity at add-time. Fall back to the current
  // GitHub identity + user row so stale or sparse snapshots still render.
  const identities = await prisma.userIdentity.findMany({
    where: {
      userId: { in: members.map((member) => member.userId) },
      provider: Provider.GITHUB,
    },
    include: { user: true },
  });
  const identityByUserId = new Map(
    identities.map((identity) => [identity.userId, identity]),
  );

  return members.map((m) => {
    const identity = identityByUserId.get(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      email: m.email ?? identity?.user.email ?? null,
      githubLogin: m.githubLogin ?? identity?.externalLogin ?? null,
      displayName: m.displayName ?? identity?.user.displayName ?? null,
      avatarUrl:
        m.avatarUrl ?? identity?.avatarUrl ?? identity?.user.avatarUrl ?? null,
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
 * Every project where the current user is an ACTIVE member, tagged with their
 * project role. Creator access follows the same path because creation inserts an
 * ACTIVE ADMIN membership. Most-recently-updated first.
 */
export async function listAccessibleProjects(): Promise<AccessibleProject[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const memberships = await prisma.projectMember.findMany({
    where: { userId, status: MemberStatus.ACTIVE },
    include: { project: true },
  });

  return memberships
    .map(({ project, role }) => ({ project, role }))
    .sort(
      (a, b) => b.project.updatedAt.getTime() - a.project.updatedAt.getTime(),
    );
}
