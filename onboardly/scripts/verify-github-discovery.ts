// Live GitHub collaborator-discovery smoke test for the normalized connection
// and identity tables. Requires the GitHub App credentials from .env.local and
// the deterministic project connection created by verify-db-rewrite-data.ts.
//
// Run with:
//   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/verify-github-discovery.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  listRepoCollaborators,
  parseRepoRef,
} from "../src/lib/github/collaborators";
import { getProjectInstallationId } from "../src/lib/github/installation";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const PROJECT_ID = "44444444-4444-4444-4444-444444444444";
const DISCOVERABLE_USER_ID = "88888888-8888-8888-8888-888888888888";
const TARGET_LOGIN = "altmahrum-web";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function ensureDiscoverableIdentity(): Promise<string> {
  const existing = await prisma.userIdentity.findUnique({
    where: {
      provider_externalLogin: {
        provider: "GITHUB",
        externalLogin: TARGET_LOGIN,
      },
    },
  });
  if (existing) return existing.userId;

  await prisma.user.upsert({
    where: { id: DISCOVERABLE_USER_ID },
    update: {},
    create: {
      id: DISCOVERABLE_USER_ID,
      displayName: "Discovery Verification User",
    },
  });
  const identity = await prisma.userIdentity.create({
    data: {
      userId: DISCOVERABLE_USER_ID,
      provider: "GITHUB",
      externalLogin: TARGET_LOGIN,
      isLogin: true,
    },
  });
  return identity.userId;
}

async function main(): Promise<void> {
  const connection = await prisma.projectConnection.findUnique({
    where: {
      projectId_provider: { projectId: PROJECT_ID, provider: "GITHUB" },
    },
  });
  const repoRef = parseRepoRef(connection?.externalRef ?? null);
  assert(Boolean(repoRef), "Verification GitHub connection is missing");

  const installationId = await getProjectInstallationId(PROJECT_ID);
  assert(
    Boolean(installationId),
    "GitHub App installation could not be resolved",
  );

  const collaborators = await listRepoCollaborators(
    repoRef!.owner,
    repoRef!.repo,
    installationId!,
  );
  assert(
    collaborators.some((collaborator) => collaborator.login === TARGET_LOGIN),
    `${TARGET_LOGIN} is not a collaborator on ${connection?.externalRef}`,
  );

  const userId = await ensureDiscoverableIdentity();
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: PROJECT_ID, userId } },
  });
  assert(
    !membership || membership.status === "REMOVED",
    `${TARGET_LOGIN} already has an ACTIVE project membership`,
  );

  console.log(`Installation id resolved: ${installationId}`);
  console.log(`Collaborators fetched: ${collaborators.length}`);
  console.log(`${TARGET_LOGIN}: addable through user_identities`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
