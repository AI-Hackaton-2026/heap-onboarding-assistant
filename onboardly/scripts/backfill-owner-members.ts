// B1 backfill (T-MEM-1): ensure every existing project has its org owner as an
// ACTIVE ADMIN ProjectMember. Idempotent — re-running is a no-op thanks to the
// @@unique([projectId, userId]) constraint (upsert with an empty update).
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
    include: { organization: true },
  });
  console.log(`Found ${projects.length} project(s).`);

  let created = 0;
  let existed = 0;
  for (const project of projects) {
    const ownerId = project.organization.ownerId;
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
      },
    });
    if (before) existed++;
    else created++;
  }

  console.log(`Owner members — created: ${created}, already present: ${existed}`);

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
