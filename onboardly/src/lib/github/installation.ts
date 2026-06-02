// Resolve the GitHub App installation id for a project's connected repo.
//
// Member discovery needs an installation id to mint an installation token for
// the collaborators API. We prefer a stored value (the Phase-3 connect flow will
// persist it on the GITHUB integration row), but fall back to resolving it live
// from the repo owner — so discovery works for any repo the App is installed on,
// today, without a connect step. Returns null only when the App isn't installed.

import { prisma } from "@/lib/db/prisma";
import { getRepoInstallationId } from "@/lib/github/client";
import { parseRepoRef } from "@/lib/github/collaborators";
import { IntegrationType } from "@/generated/prisma/enums";

/** Read a stored installation id from the project's GitHub integration config. */
async function getStoredInstallationId(
  projectId: string,
): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { projectId_type: { projectId, type: IntegrationType.GITHUB } },
    select: { config: true },
  });
  if (!integration?.config || typeof integration.config !== "object") {
    return null;
  }
  const config = integration.config as Record<string, unknown>;
  const raw = config.installationId ?? config.installation_id;
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (typeof raw === "number") return String(raw);
  return null;
}

/**
 * The GitHub App installation id for a project's repo. Tries the stored
 * integration value first, then resolves it live from the repo owner via the App
 * JWT. Returns null when the repo isn't set or the App isn't installed on it
 * (discovery then degrades to the "install the app" empty state).
 */
export async function getProjectInstallationId(
  projectId: string,
): Promise<string | null> {
  const stored = await getStoredInstallationId(projectId);
  if (stored) return stored;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { githubRepo: true },
  });
  const repoRef = parseRepoRef(project?.githubRepo ?? null);
  if (!repoRef) return null;

  try {
    return await getRepoInstallationId(repoRef.owner, repoRef.repo);
  } catch {
    return null; // GitHub error — degrade to "couldn't reach GitHub".
  }
}
