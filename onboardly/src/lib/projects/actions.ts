// Project write actions — create, update, delete. Called from the project
// forms and the delete button. Prisma bypasses RLS, so mutations re-check the
// current user's project membership in app logic.

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { fetchRepoReadme } from "@/lib/github/oauth";
import { getCurrentUserId, requireProjectAdmin } from "@/lib/members/access";
import { findAvailableGitHubRepo } from "@/lib/projects/github";
import {
  ConnectionStatus,
  Provider,
  ProjectStatus,
  ProjectRole,
  MemberSource,
  MemberStatus,
} from "@/generated/prisma/enums";

export type ProjectFormState = { error: string } | undefined;
export type GitHubRepoDefaultsState =
  | { name: string; description: string; notice?: string }
  | { error: string };

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

/** Populate create-form defaults from one still-available GitHub repository. */
export async function loadGitHubRepoDefaults(
  fullName: string,
): Promise<GitHubRepoDefaultsState> {
  try {
    const selected = await findAvailableGitHubRepo(fullName);
    if (!selected) {
      return { error: "That GitHub repository is no longer available." };
    }

    try {
      const readme = await fetchRepoReadme(
        selected.token,
        selected.repo.fullName,
      );
      return {
        name: selected.repo.name,
        description: readme ?? selected.repo.description ?? "",
      };
    } catch {
      return {
        name: selected.repo.name,
        description: selected.repo.description ?? "",
        notice: "README unavailable. Using the GitHub repository description.",
      };
    }
  } catch {
    return {
      error: "Could not load that GitHub repository. Please reconnect.",
    };
  }
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const userId = await getCurrentUserId();
  if (!userId) {
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
  let githubRepo = optionalField(formData, "githubRepo");
  const slackWorkspace = optionalField(formData, "slackWorkspace");

  if (githubRepo) {
    try {
      const selected = await findAvailableGitHubRepo(githubRepo);
      if (!selected) {
        return {
          error:
            "That GitHub repository is unavailable or already linked to a project.",
        };
      }
      githubRepo = selected.repo.fullName;
    } catch {
      return {
        error: "Could not verify that GitHub repository. Please reconnect.",
      };
    }
  }

  // Create the project, seat its creator, and record initial connections in one
  // transaction so every project starts with a real access path.
  const project = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
    const identity = await tx.userIdentity.findUnique({
      where: {
        userId_provider: { userId, provider: Provider.GITHUB },
      },
    });
    const created = await tx.project.create({
      data: {
        ownerId: userId,
        name,
        description: optionalField(formData, "description"),
        status,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: created.id,
        userId,
        role: ProjectRole.ADMIN,
        source: MemberSource.MANUAL,
        status: MemberStatus.ACTIVE,
        joinedAt: new Date(),
        email: user.email,
        githubLogin: identity?.externalLogin ?? null,
        displayName: user.displayName,
        avatarUrl: identity?.avatarUrl ?? user.avatarUrl,
      },
    });

    const connections = [
      ...(githubRepo
        ? [
            {
              projectId: created.id,
              provider: Provider.GITHUB,
              externalRef: githubRepo,
              status: ConnectionStatus.CONNECTED,
              connectedAt: new Date(),
            },
          ]
        : []),
      ...(slackWorkspace
        ? [
            {
              projectId: created.id,
              provider: Provider.SLACK,
              externalRef: slackWorkspace,
              status: ConnectionStatus.CONNECTED,
              connectedAt: new Date(),
            },
          ]
        : []),
    ];

    if (connections.length > 0) {
      await tx.projectConnection.createMany({ data: connections });
    }

    return created;
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}?created=1`);
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

  const connections = [
    {
      provider: Provider.GITHUB,
      externalRef: optionalField(formData, "githubRepo"),
    },
    {
      provider: Provider.SLACK,
      externalRef: optionalField(formData, "slackWorkspace"),
    },
  ];

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: existing.id },
      data: {
        name,
        description: optionalField(formData, "description"),
        status,
      },
    });

    for (const connection of connections) {
      if (!connection.externalRef) {
        await tx.projectConnection.deleteMany({
          where: { projectId: existing.id, provider: connection.provider },
        });
        continue;
      }

      await tx.projectConnection.upsert({
        where: {
          projectId_provider: {
            projectId: existing.id,
            provider: connection.provider,
          },
        },
        update: {
          externalRef: connection.externalRef,
          status: ConnectionStatus.CONNECTED,
          connectedAt: new Date(),
        },
        create: {
          projectId: existing.id,
          provider: connection.provider,
          externalRef: connection.externalRef,
          status: ConnectionStatus.CONNECTED,
          connectedAt: new Date(),
        },
      });
    }
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${existing.id}`);
  redirect(`/projects/${existing.id}`);
}

export async function deleteProject(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const access = projectId ? await requireProjectAdmin(projectId) : null;
  if (!access) {
    return { ok: false, error: "Only project admins can delete this project." };
  }

  try {
    await prisma.project.delete({ where: { id: access.project.id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    console.error("[deleteProject]", message);
    return { ok: false, error: "Could not delete the project. Try again." };
  }

  revalidatePath("/projects");
  return { ok: true };
}
