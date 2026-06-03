// GitHub connection write actions for a project — verify access and disconnect.
// Every action re-checks admin via requireProjectAdmin on the server (Prisma
// bypasses RLS, so this is the real gate). Repo *selection* happens in
// create/edit; this slice manages the live connection state on the overview:
// resolve the App installation, verify the installation can read the repo, and
// record CONNECTED / ERROR on the normalized project_connections row.

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireProjectAdmin } from "@/lib/members/access";
import { getProjectConnection } from "@/lib/projects/connections";
import { getProjectInstallationId } from "@/lib/github/installation";
import { parseRepoRef } from "@/lib/github/collaborators";
import { verifyRepoAccess } from "@/lib/github/client";
import { Provider, ConnectionStatus } from "@/generated/prisma/enums";

export type ConnectionActionResult =
  | { ok: true; status: ConnectionStatus }
  | { ok: false; error: string };

/**
 * Verify the project's GitHub connection: resolve the App installation for the
 * connected repo, confirm it can actually read the repo, and persist the result
 * (CONNECTED + connectedAt on success, ERROR otherwise). Idempotent; safe to
 * call repeatedly from a "Verify access" button.
 */
export async function verifyGitHubConnection(
  projectId: string,
): Promise<ConnectionActionResult> {
  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return { ok: false, error: "Only admins can manage connections." };
  }

  const connection = await getProjectConnection(projectId, Provider.GITHUB);
  const repoRef = parseRepoRef(connection?.externalRef ?? null);
  if (!repoRef) {
    return {
      ok: false,
      error: "Set a GitHub repository on this project first (Edit project).",
    };
  }

  // getProjectInstallationId resolves live from the repo owner and self-heals a
  // stale/wrong stored id; null means the App isn't installed on the owner.
  const installationId = await getProjectInstallationId(projectId);
  if (!installationId) {
    await setConnectionStatus(projectId, ConnectionStatus.DISCONNECTED, null);
    revalidatePath(`/projects/${projectId}`);
    return {
      ok: false,
      error:
        "The Onboardly GitHub App isn't installed on this repository. An owner of its account or organization must install it.",
    };
  }

  let verified;
  try {
    verified = await verifyRepoAccess(
      repoRef.owner,
      repoRef.repo,
      installationId,
    );
  } catch {
    await setConnectionStatus(projectId, ConnectionStatus.ERROR, null);
    revalidatePath(`/projects/${projectId}`);
    return {
      ok: false,
      error: "Couldn't reach GitHub to verify access. Try again shortly.",
    };
  }

  if (!verified) {
    await setConnectionStatus(projectId, ConnectionStatus.ERROR, null);
    revalidatePath(`/projects/${projectId}`);
    return {
      ok: false,
      error:
        "The GitHub App can't read this repository. Reinstall it on the repo's owner, then verify again.",
    };
  }

  await setConnectionStatus(
    projectId,
    ConnectionStatus.CONNECTED,
    new Date(),
    installationId,
  );
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, status: ConnectionStatus.CONNECTED };
}

/**
 * Disconnect the project's GitHub connection: clear the installation id and mark
 * it DISCONNECTED. The repo reference is kept (selection lives in edit) so the
 * admin can re-verify later without re-entering it.
 */
export async function disconnectGitHubConnection(
  projectId: string,
): Promise<ConnectionActionResult> {
  const access = await requireProjectAdmin(projectId);
  if (!access) {
    return { ok: false, error: "Only admins can manage connections." };
  }

  await prisma.projectConnection.updateMany({
    where: { projectId, provider: Provider.GITHUB },
    data: {
      status: ConnectionStatus.DISCONNECTED,
      installationId: null,
      connectedAt: null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, status: ConnectionStatus.DISCONNECTED };
}

/** Persist connection status (+ optional connectedAt / installationId). */
async function setConnectionStatus(
  projectId: string,
  status: ConnectionStatus,
  connectedAt: Date | null,
  installationId?: string,
): Promise<void> {
  await prisma.projectConnection.updateMany({
    where: { projectId, provider: Provider.GITHUB },
    data: {
      status,
      connectedAt,
      ...(installationId ? { installationId } : {}),
    },
  });
}
