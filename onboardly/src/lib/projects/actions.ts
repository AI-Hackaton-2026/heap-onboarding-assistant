// Project write actions — create, update, delete. Called from the project
// forms and the delete button. All run on the server and scope every write to
// the current user's organization (Prisma bypasses RLS — isolation is enforced
// here, not in the database).

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentOrganization } from "@/lib/projects/queries";
import { requireProjectAdmin } from "@/lib/members/access";
import {
  ProjectStatus,
  ProjectRole,
  MemberSource,
  MemberStatus,
} from "@/generated/prisma/enums";

export type ProjectFormState = { error: string } | undefined;

const PROJECT_STATUSES = Object.values(ProjectStatus);

function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as string[]).includes(value);
}

/** Read a trimmed string field from the form, or "" when absent. */
function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Optional text field — empty input becomes null (not an empty string). */
function optionalField(formData: FormData, name: string): string | null {
  const value = field(formData, name);
  return value.length > 0 ? value : null;
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const org = await getCurrentOrganization();
  if (!org) {
    return { error: "You must be signed in to create a project." };
  }

  const name = field(formData, "name");
  if (!name) {
    return { error: "Project name is required." };
  }

  const statusInput = field(formData, "status");
  const status =
    statusInput && isProjectStatus(statusInput)
      ? statusInput
      : ProjectStatus.DRAFT;

  // Create the project and seat the creator as its first ADMIN member in one
  // transaction, so the membership layer has an owner from the start.
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        organizationId: org.id,
        name,
        description: optionalField(formData, "description"),
        githubRepo: optionalField(formData, "githubRepo"),
        slackWorkspace: optionalField(formData, "slackWorkspace"),
        status,
      },
    });

    const profile = await tx.userProfile.findUnique({
      where: { userId: org.ownerId },
    });
    await tx.projectMember.create({
      data: {
        projectId: created.id,
        userId: org.ownerId,
        role: ProjectRole.ADMIN,
        source: MemberSource.MANUAL,
        status: MemberStatus.ACTIVE,
        joinedAt: new Date(),
        email: profile?.email ?? null,
        githubLogin: profile?.githubLogin ?? null,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
    });

    return created;
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const projectId = field(formData, "projectId");
  // Admin gate doubles as the access/isolation check before we mutate — members
  // get read access via getProject, but only admins may edit.
  const access = projectId ? await requireProjectAdmin(projectId) : null;
  if (!access) {
    return { error: "Project not found." };
  }
  const existing = access.project;

  const name = field(formData, "name");
  if (!name) {
    return { error: "Project name is required." };
  }

  const statusInput = field(formData, "status");
  const status =
    statusInput && isProjectStatus(statusInput) ? statusInput : existing.status;

  await prisma.project.update({
    where: { id: existing.id },
    data: {
      name,
      description: optionalField(formData, "description"),
      githubRepo: optionalField(formData, "githubRepo"),
      slackWorkspace: optionalField(formData, "slackWorkspace"),
      status,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${existing.id}`);
  redirect(`/projects/${existing.id}`);
}

export async function deleteProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const access = projectId ? await requireProjectAdmin(projectId) : null;
  if (!access) {
    // Not an admin (or not ours) — fall through to the list quietly.
    redirect("/projects");
  }

  await prisma.project.delete({ where: { id: access.project.id } });

  revalidatePath("/projects");
  redirect("/projects");
}
