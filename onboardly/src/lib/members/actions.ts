// Member write actions — add, remove (soft-delete), change role. Every action
// re-checks admin via requireProjectAdmin on the server (Prisma bypasses RLS, so
// this is the real gate — not the hidden UI). Remove is a soft-delete so prior
// LessonProgress survives a re-add; re-adding reactivates the existing row via
// upsert on @@unique([projectId, userId]). The last ADMIN can never be removed
// or demoted, so a project is never left without an owner.

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireProjectAdmin } from "@/lib/members/access";
import {
  ProjectRole,
  MemberStatus,
  MemberSource,
  Provider,
} from "@/generated/prisma/enums";

export type MemberActionResult = { ok: true } | { ok: false; error: string };

/** Count the project's ACTIVE admins — used to protect the last one. */
async function countActiveAdmins(projectId: string): Promise<number> {
  return prisma.projectMember.count({
    where: {
      projectId,
      role: ProjectRole.ADMIN,
      status: MemberStatus.ACTIVE,
    },
  });
}

/**
 * Add Onboardly users (by Supabase userId) to a project as ACTIVE members.
 * Discovery/candidate validation happens upstream; this trusts that each userId
 * is a real Onboardly user the admin chose. Uses upsert so a previously-REMOVED
 * member is reactivated (restoring their LessonProgress) rather than duplicated.
 * Identity fields are snapshotted from the GitHub identity and user directory.
 */
export async function addMembers(
  projectId: string,
  userIds: string[],
): Promise<MemberActionResult> {
  const access = await requireProjectAdmin(projectId);
  if (!access) return { ok: false, error: "Only admins can add members." };

  const uniqueIds = [...new Set(userIds.filter((id) => id.length > 0))];
  if (uniqueIds.length === 0) {
    return { ok: false, error: "No members selected." };
  }

  const identities = await prisma.userIdentity.findMany({
    where: { userId: { in: uniqueIds }, provider: Provider.GITHUB },
    include: { user: true },
  });
  if (identities.length === 0) {
    return { ok: false, error: "Selected users were not found." };
  }

  const now = new Date();
  await prisma.$transaction(
    identities.map((identity) =>
      prisma.projectMember.upsert({
        where: {
          projectId_userId: { projectId, userId: identity.userId },
        },
        // Reactivate a soft-deleted/invited row; keep its role if already admin.
        update: {
          status: MemberStatus.ACTIVE,
          joinedAt: now,
          email: identity.user.email,
          githubLogin: identity.externalLogin,
          displayName: identity.user.displayName,
          avatarUrl: identity.avatarUrl ?? identity.user.avatarUrl,
        },
        create: {
          projectId,
          userId: identity.userId,
          role: ProjectRole.MEMBER,
          source: MemberSource.GITHUB,
          status: MemberStatus.ACTIVE,
          joinedAt: now,
          email: identity.user.email,
          githubLogin: identity.externalLogin,
          displayName: identity.user.displayName,
          avatarUrl: identity.avatarUrl ?? identity.user.avatarUrl,
        },
      }),
    ),
  );

  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/**
 * Soft-remove a member: set status REMOVED, keeping the row and its
 * LessonProgress so a re-add restores prior progress. Refuses to remove the last
 * ACTIVE admin so the project always retains an owner.
 */
export async function removeMember(
  projectId: string,
  memberId: string,
): Promise<MemberActionResult> {
  const access = await requireProjectAdmin(projectId);
  if (!access) return { ok: false, error: "Only admins can remove members." };

  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId, status: MemberStatus.ACTIVE },
  });
  if (!member) return { ok: false, error: "Member not found." };

  if (
    member.role === ProjectRole.ADMIN &&
    (await countActiveAdmins(projectId)) <= 1
  ) {
    return { ok: false, error: "You can't remove the last admin." };
  }

  await prisma.projectMember.update({
    where: { id: member.id },
    data: { status: MemberStatus.REMOVED },
  });

  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/**
 * Change an ACTIVE member's role. Demoting the last admin is refused (a project
 * must always keep at least one admin). Promoting to admin is always allowed.
 */
export async function setMemberRole(
  projectId: string,
  memberId: string,
  role: ProjectRole,
): Promise<MemberActionResult> {
  const access = await requireProjectAdmin(projectId);
  if (!access) return { ok: false, error: "Only admins can change roles." };

  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId, status: MemberStatus.ACTIVE },
  });
  if (!member) return { ok: false, error: "Member not found." };

  if (member.role === role) return { ok: true };

  if (
    member.role === ProjectRole.ADMIN &&
    role === ProjectRole.MEMBER &&
    (await countActiveAdmins(projectId)) <= 1
  ) {
    return { ok: false, error: "You can't demote the last admin." };
  }

  await prisma.projectMember.update({
    where: { id: member.id },
    data: { role },
  });

  revalidatePath(`/projects/${projectId}/members`);
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
