// Project + organization reads. Access is enforced in app logic because Prisma
// connects as `postgres` and bypasses Supabase RLS (see src/lib/db/prisma.ts).
// Reads now go through the membership access guard (src/lib/members/access.ts):
// a user can see projects they own AND projects they're an ACTIVE member of
// (cross-org), but never the rest of a foreign org. Org owner ⇒ ADMIN.

import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId, getProjectAccess } from "@/lib/members/access";
import { listAccessibleProjects } from "@/lib/members/queries";
import type { Organization, Project } from "@/generated/prisma/client";

/**
 * Ensure the current user has an organization and return it. We auto-create one
 * on first use so projects always have a tenant to live under — full org
 * management UI is out of scope for this slice. Returns null when unauthenticated.
 */
export async function getCurrentOrganization(): Promise<Organization | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const existing = await prisma.organization.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.organization.create({
    data: { name: "My Organization", ownerId: userId },
  });
}

/**
 * List every project the current user can see, most-recently-updated first.
 * This is now the union of projects they own (as org owner) ∪ projects they're
 * an ACTIVE member of — so a developer added to a project in another org sees
 * that one project here too. Returns an empty array when unauthenticated.
 *
 * Callers that need the caller's role per project should use
 * `listAccessibleProjects()` directly; this keeps the legacy `Project[]` shape.
 */
export async function listProjects(): Promise<Project[]> {
  const accessible = await listAccessibleProjects();
  return accessible.map((entry) => entry.project);
}

/**
 * Fetch a single project the current user can access (as org owner OR ACTIVE
 * member), or null when they can't. Delegates to the access guard so membership
 * grants visibility of that one project even across orgs. Role-gated mutations
 * must still call `requireProjectAdmin` — read access alone is not edit access.
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const access = await getProjectAccess(projectId);
  return access?.project ?? null;
}
