// Repair utility: ensure every project owner has an ACTIVE ADMIN membership.
// The greenfield model creates this row transactionally, but this remains useful
// after manual imports. Idempotent via @@unique([projectId, userId]).
//
// Run once after `npm run db:push`:
//   npx tsx --env-file=.env.local scripts/backfill-owner-members.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const projects = await prisma.project.findMany({
    include: {
      owner: true,
    },
  });
  console.log(`Found ${projects.length} project(s).`);

  let created = 0;
  let existed = 0;
  for (const project of projects) {
    const ownerId = project.ownerId;
    const identity = await prisma.userIdentity.findUnique({
      where: { userId_provider: { userId: ownerId, provider: "GITHUB" } },
    });
    const before = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: ownerId } },
    });
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: ownerId } },
      // Reactivate if a soft-deleted row exists; otherwise leave as-is.
      update: { role: "ADMIN", status: "ACTIVE" },
      create: {
        projectId: project.id,
        userId: ownerId,
        role: "ADMIN",
        source: "MANUAL",
        status: "ACTIVE",
        joinedAt: new Date(),
        email: project.owner.email,
        githubLogin: identity?.externalLogin ?? null,
        displayName: project.owner.displayName,
        avatarUrl: identity?.avatarUrl ?? project.owner.avatarUrl,
      },
    });
    if (before) existed++;
    else created++;
  }

  console.log(
    `Owner members — created: ${created}, already present: ${existed}`,
  );

  const total = await prisma.projectMember.count();
  const admins = await prisma.projectMember.count({ where: { role: "ADMIN" } });
  console.log(`project_members total: ${total} (ADMIN: ${admins})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
