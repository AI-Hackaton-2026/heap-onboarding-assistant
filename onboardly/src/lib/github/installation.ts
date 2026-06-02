// Resolve the GitHub App installation id for a project's connected repo.
//
// Member discovery needs an installation id to mint an installation token for
// the collaborators API. We prefer a stored value (the Phase-3 connect flow will
// persist it on the GITHUB connection row), but fall back to resolving it live
// from the repo owner — so discovery works for any repo the App is installed on,
// today, without a connect step. Returns null only when the App isn't installed.

import { prisma } from "@/lib/db/prisma";
import { getRepoInstallationId } from "@/lib/github/client";
import { parseRepoRef } from "@/lib/github/collaborators";
import { Provider } from "@/generated/prisma/enums";

/** Read the project's normalized GitHub connection. */
async function getGitHubConnection(projectId: string): Promise<{
  installationId: string | null;
  externalRef: string | null;
} | null> {
  return prisma.projectConnection.findUnique({
    where: { projectId_provider: { projectId, provider: Provider.GITHUB } },
    select: { installationId: true, externalRef: true },
  });
}

/**
 * The GitHub App installation id for a project's repo. Tries the stored
 * connection value first, then resolves it live from the repo owner via the App
 * JWT. Returns null when the repo isn't set or the App isn't installed on it
 * (discovery then degrades to the "install the app" empty state).
 */
export async function getProjectInstallationId(
  projectId: string,
): Promise<string | null> {
  const connection = await getGitHubConnection(projectId);
  if (connection?.installationId) return connection.installationId;

  const repoRef = parseRepoRef(connection?.externalRef ?? null);
  if (!repoRef) return null;

  try {
    return await getRepoInstallationId(repoRef.owner, repoRef.repo);
  } catch {
    return null; // GitHub error — degrade to "couldn't reach GitHub".
  }
}
