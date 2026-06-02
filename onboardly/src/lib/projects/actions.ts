// Project write actions — create, update, delete. Called from the project
// forms and the delete button. All run on the server and scope every write to
// the current user's organization (Prisma bypasses RLS — isolation is enforced
// here, not in the database).

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentOrganization, getProject } from "@/lib/projects/queries";
import { ProjectStatus } from "@/generated/prisma/enums";

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

  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name,
      description: optionalField(formData, "description"),
      githubRepo: optionalField(formData, "githubRepo"),
      slackWorkspace: optionalField(formData, "slackWorkspace"),
      status,
    },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const projectId = field(formData, "projectId");
  // Scoped fetch doubles as the tenant-isolation check before we mutate.
  const existing = projectId ? await getProject(projectId) : null;
  if (!existing) {
    return { error: "Project not found." };
  }

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
  const existing = projectId ? await getProject(projectId) : null;
  if (!existing) {
    // Nothing to delete (or not ours) — fall through to the list quietly.
    redirect("/projects");
  }

  await prisma.project.delete({ where: { id: existing.id } });

  revalidatePath("/projects");
  redirect("/projects");
}
