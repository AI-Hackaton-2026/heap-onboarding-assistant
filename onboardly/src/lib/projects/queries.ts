// Project + organization reads. All queries are scoped to the current user's
// organization in app logic, because Prisma connects as `postgres` and bypasses
// Supabase RLS (see src/lib/db/prisma.ts). Never expose another org's projects.

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Project } from "@/generated/prisma/client";

/**
 * The Supabase auth user id of the current request, or null when unauthenticated.
 * Authenticated routes are already guarded by middleware + the (auth) layout;
 * this is the value we tie organizations to (Organization.ownerId).
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

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
 * List the current organization's projects, most-recently-updated first.
 * Returns an empty array when there is no authenticated user / org.
 */
export async function listProjects(): Promise<Project[]> {
  const org = await getCurrentOrganization();
  if (!org) return [];

  return prisma.project.findMany({
    where: { organizationId: org.id },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Fetch a single project by id, scoped to the current organization. Returns
 * null when it doesn't exist or belongs to another org (tenant isolation).
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const org = await getCurrentOrganization();
  if (!org) return null;

  return prisma.project.findFirst({
    where: { id: projectId, organizationId: org.id },
  });
}
