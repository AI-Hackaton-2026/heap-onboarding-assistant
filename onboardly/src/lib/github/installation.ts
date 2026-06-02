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
 * The GitHub App installation id for a project's repo. We resolve it *live* from
 * the repo owner (GET /repos/{owner}/{repo}/installation) because that returns
 * the installation that actually has the repo — the authoritative source. A
 * stored id can be stale or for the wrong account (e.g. a personal installation
 * id saved for an org repo), which mints a token that 404s on the collaborators
 * API; trusting it blindly was the bug. The stored id is used only as a fallback
 * when the live lookup itself errors (network/GitHub hiccup). When the live
 * value succeeds and differs from what's stored, we self-heal the row.
 *
 * Returns null when the repo isn't set or the App isn't installed on the repo's
 * owner (discovery then degrades to the "install the app" empty state).
 */
export async function getProjectInstallationId(
  projectId: string,
): Promise<string | null> {
  const connection = await getGitHubConnection(projectId);
  const repoRef = parseRepoRef(connection?.externalRef ?? null);
  if (!repoRef) return connection?.installationId ?? null;

  try {
    const live = await getRepoInstallationId(repoRef.owner, repoRef.repo);
    // App not installed on this repo's owner — ignore any stale stored id so
    // the UI shows "install the app" rather than 404ing on a wrong token.
    if (!live) return null;
    if (live !== connection?.installationId) {
      await saveProjectInstallationId(projectId, live); // self-heal stale/wrong id
    }
    return live;
  } catch {
    // Live lookup failed (network/GitHub). Fall back to the stored id if any.
    return connection?.installationId ?? null;
  }
}

/**
 * Persist a GitHub App installation id onto a project's GITHUB connection. Used
 * by the App-install callback so later collaborator discovery uses the stored id
 * directly instead of re-resolving it live. No-ops cleanly if the project has no
 * GitHub connection row yet (nothing to attach the installation to).
 */
export async function saveProjectInstallationId(
  projectId: string,
  installationId: string,
): Promise<boolean> {
  const result = await prisma.projectConnection.updateMany({
    where: { projectId, provider: Provider.GITHUB },
    data: { installationId },
  });
  return result.count > 0;
}
