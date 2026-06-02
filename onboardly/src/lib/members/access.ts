// Project access guards. These supersede the old org-scoped getProject for any
// surface a *member* (not just the org owner) can reach. Prisma connects as
// `postgres` and bypasses Supabase RLS, so access is enforced here in app logic:
//
//   - Org owner            ⇒ effective role ADMIN (always, even without a row).
//   - ACTIVE ProjectMember ⇒ their stored role (ADMIN | MEMBER).
//   - anyone else          ⇒ no access (null).
//
// Membership grants access to *that one project only*, never the whole foreign
// org — that's the cross-org visibility rule. Every mutation re-checks admin via
// requireProjectAdmin; hiding a button in the UI is not a security boundary.

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { ProjectRole, MemberStatus } from "@/generated/prisma/enums";
import type { ProjectAccess } from "@/types/member";

/** The Supabase auth user id of the current request, or null when unauthenticated. */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Resolve the current user's access to a single project. Returns the project and
 * the caller's effective role, or null when they neither own the project's org
 * nor are an ACTIVE member of it. This is the canonical read guard — pages should
 * `notFound()` on null.
 */
export async function getProjectAccess(
  projectId: string,
): Promise<ProjectAccess | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { organization: { select: { ownerId: true } } },
  });
  if (!project) return null;

  // Org owner ⇒ always ADMIN, even if no member row exists yet.
  if (project.organization.ownerId === userId) {
    return { project, role: ProjectRole.ADMIN };
  }

  // Otherwise the caller must be an ACTIVE member of this specific project.
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true, status: true },
  });
  if (!membership || membership.status !== MemberStatus.ACTIVE) return null;

  return { project, role: membership.role };
}

/**
 * Require that the current user is an ADMIN of the project. Returns the access
 * record on success, or null when the caller lacks admin rights (or any access).
 * Call this at the top of every project mutation — it's the server-side gate that
 * RLS would otherwise provide.
 */
export async function requireProjectAdmin(
  projectId: string,
): Promise<ProjectAccess | null> {
  const access = await getProjectAccess(projectId);
  if (!access || access.role !== ProjectRole.ADMIN) return null;
  return access;
}
