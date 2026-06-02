// Demo seed — inserts a demo organisation + project with deterministic UUIDs.
// Run with:  npm run db:seed
//
// The script reads SEED_USER_ID from the environment (or falls back to a
// placeholder). Set it to your Supabase auth user ID so the org owner is
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

const DEMO_ORG_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const DEMO_PROJECT_ID = "bbbbbbbb-0000-0000-0000-000000000001";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  const userId = process.env.SEED_USER_ID ?? "00000000-0000-0000-0000-000000000000";

  await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: {
      id: DEMO_ORG_ID,
      name: "Demo Organisation",
      ownerId: userId,
    },
  });

  await prisma.project.upsert({
    where: { id: DEMO_PROJECT_ID },
    update: {},
    create: {
      id: DEMO_PROJECT_ID,
      organizationId: DEMO_ORG_ID,
      name: "Onboardly Demo Project",
      description: "Demo project for the AI onboarding assistant.",
      githubRepo: "heap/onboardly",
      status: "READY",
    },
  });

  console.log(`✓ Demo org   ${DEMO_ORG_ID}`);
  console.log(`✓ Demo project ${DEMO_PROJECT_ID}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
