// Low-level project connection reads. Callers enforce project access before
// exposing these values to a page or mutation.

import { prisma } from "@/lib/db/prisma";
import { Provider } from "@/generated/prisma/enums";
import type { ProjectConnection } from "@/generated/prisma/client";

export interface ProjectConnectionRefs {
  githubRepo: string | null;
  slackWorkspace: string | null;
}

/** Read one provider connection for a project. */
export async function getProjectConnection(
  projectId: string,
  provider: Provider,
): Promise<ProjectConnection | null> {
  return prisma.projectConnection.findUnique({
    where: { projectId_provider: { projectId, provider } },
  });
}

/** Read the repo/workspace values consumed by the existing project UI. */
export async function getProjectConnectionRefs(
  projectId: string,
): Promise<ProjectConnectionRefs> {
  const connections = await prisma.projectConnection.findMany({
    where: { projectId },
    select: { provider: true, externalRef: true },
  });

  return {
    githubRepo:
      connections.find((connection) => connection.provider === Provider.GITHUB)
        ?.externalRef ?? null,
    slackWorkspace:
      connections.find((connection) => connection.provider === Provider.SLACK)
        ?.externalRef ?? null,
  };
}
