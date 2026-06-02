// Demo seed — inserts a demo user, identity, project, membership, and connection
// with deterministic UUIDs.
// Run with:  npm run db:seed
//
// The script reads SEED_USER_ID from the environment (or falls back to a
// placeholder). Set it to your Supabase auth user ID so the project owner is
// correct:
//
//   SEED_USER_ID=<your-user-uuid> npm run db:seed
//
// Safe to run multiple times — upserts on the fixed UUIDs.

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local so DATABASE_URL is available when running outside Next.js
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_PROJECT_ID = "bbbbbbbb-0000-0000-0000-000000000001";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  const userId =
    process.env.SEED_USER_ID ?? "00000000-0000-0000-0000-000000000000";
  const githubLogin = (
    process.env.SEED_GITHUB_LOGIN ?? "onboardly-demo"
  ).toLowerCase();

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      displayName: "Demo User",
    },
  });

  await prisma.userIdentity.upsert({
    where: { userId_provider: { userId, provider: "GITHUB" } },
    update: { externalLogin: githubLogin },
    create: {
      userId,
      provider: "GITHUB",
      externalLogin: githubLogin,
      isLogin: true,
    },
  });

  await prisma.project.upsert({
    where: { id: DEMO_PROJECT_ID },
    update: {},
    create: {
      id: DEMO_PROJECT_ID,
      ownerId: userId,
      name: "Onboardly Demo Project",
      description: "Demo project for the AI onboarding assistant.",
      status: "READY",
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: DEMO_PROJECT_ID, userId } },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      projectId: DEMO_PROJECT_ID,
      userId,
      githubLogin,
      role: "ADMIN",
      source: "MANUAL",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
  });

  await prisma.projectConnection.upsert({
    where: {
      projectId_provider: { projectId: DEMO_PROJECT_ID, provider: "GITHUB" },
    },
    update: { externalRef: "heap/onboardly", status: "CONNECTED" },
    create: {
      projectId: DEMO_PROJECT_ID,
      provider: "GITHUB",
      externalRef: "heap/onboardly",
      status: "CONNECTED",
      connectedAt: new Date(),
    },
  });

  console.log(`Demo user    ${userId}`);
  console.log(`Demo project ${DEMO_PROJECT_ID}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
