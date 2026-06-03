// Project reads. Access is enforced in app logic because Prisma connects as
// `postgres` and bypasses Supabase RLS (see src/lib/db/prisma.ts). Every visible
// project comes from an ACTIVE membership, including projects the user created.

import { getProjectAccess } from "@/lib/members/access";
import { listAccessibleProjects } from "@/lib/members/queries";
import type { Project } from "@/generated/prisma/client";

/**
 * List every project the current user can see, most-recently-updated first.
 * Every project where they are an ACTIVE member. Returns an empty array when
 * unauthenticated.
 *
 * Callers that need the caller's role per project should use
 * `listAccessibleProjects()` directly; this keeps the legacy `Project[]` shape.
 */
export async function listProjects(): Promise<Project[]> {
  const accessible = await listAccessibleProjects();
  return accessible.map((entry) => entry.project);
}

/**
 * Fetch a single project the current user can access as an ACTIVE member, or
 * null when they cannot. Mutations must still call `requireProjectAdmin`.
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const access = await getProjectAccess(projectId);
  return access?.project ?? null;
}
