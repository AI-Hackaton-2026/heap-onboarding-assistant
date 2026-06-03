// Idempotent write-side smoke test for the normalized project-membership model.
// Leaves deterministic fixture rows in place so reruns update the same records.
//
// Run with:
//   npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/verify-db-rewrite-data.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const OWNER_ID = "11111111-1111-1111-1111-111111111111";
const MEMBER_ID = "22222222-2222-2222-2222-222222222222";
const STRANGER_ID = "33333333-3333-3333-3333-333333333333";
const PROJECT_ID = "44444444-4444-4444-4444-444444444444";
const COURSE_ID = "55555555-5555-5555-5555-555555555555";
const MODULE_ID = "66666666-6666-6666-6666-666666666666";
const LESSON_ID = "77777777-7777-7777-7777-777777777777";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function upsertUser(
  userId: string,
  externalLogin: string,
): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: `${externalLogin}@example.com`,
      displayName: externalLogin,
    },
  });
  await prisma.userIdentity.upsert({
    where: { userId_provider: { userId, provider: "GITHUB" } },
    update: { externalLogin },
    create: {
      userId,
      provider: "GITHUB",
      externalLogin,
      isLogin: true,
    },
  });
}

async function accessibleProjectIds(userId: string): Promise<string[]> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId, status: "ACTIVE" },
    select: { projectId: true },
  });
  return memberships.map((membership) => membership.projectId);
}

async function main(): Promise<void> {
  await upsertUser(OWNER_ID, "db-rewrite-owner");
  await upsertUser(MEMBER_ID, "db-rewrite-member");
  await upsertUser(STRANGER_ID, "db-rewrite-stranger");

  await prisma.project.upsert({
    where: { id: PROJECT_ID },
    update: {},
    create: {
      id: PROJECT_ID,
      ownerId: OWNER_ID,
      name: "DB Rewrite Verification",
      status: "READY",
    },
  });
  await prisma.projectConnection.upsert({
    where: {
      projectId_provider: { projectId: PROJECT_ID, provider: "GITHUB" },
    },
    update: { externalRef: "htuco/htuco", status: "CONNECTED" },
    create: {
      projectId: PROJECT_ID,
      provider: "GITHUB",
      externalRef: "htuco/htuco",
      status: "CONNECTED",
      connectedAt: new Date(),
    },
  });
  const ownerMembership = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: PROJECT_ID, userId: OWNER_ID } },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      projectId: PROJECT_ID,
      userId: OWNER_ID,
      githubLogin: "db-rewrite-owner",
      role: "ADMIN",
      source: "MANUAL",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
  });
  const memberMembership = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: PROJECT_ID, userId: MEMBER_ID } },
    update: { role: "MEMBER", status: "ACTIVE" },
    create: {
      projectId: PROJECT_ID,
      userId: MEMBER_ID,
      githubLogin: "db-rewrite-member",
      role: "MEMBER",
      source: "GITHUB",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
  });

  await prisma.course.upsert({
    where: { id: COURSE_ID },
    update: {},
    create: {
      id: COURSE_ID,
      projectId: PROJECT_ID,
      roleName: "Verification Engineer",
      title: "Verification Course",
    },
  });
  await prisma.module.upsert({
    where: { id: MODULE_ID },
    update: {},
    create: {
      id: MODULE_ID,
      courseId: COURSE_ID,
      title: "Verification Module",
      position: 0,
    },
  });
  await prisma.lesson.upsert({
    where: { id: LESSON_ID },
    update: {},
    create: {
      id: LESSON_ID,
      moduleId: MODULE_ID,
      title: "Verification Lesson",
      position: 0,
    },
  });
  await prisma.lessonProgress.upsert({
    where: {
      lessonId_memberId: {
        lessonId: LESSON_ID,
        memberId: memberMembership.id,
      },
    },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: {
      lessonId: LESSON_ID,
      memberId: memberMembership.id,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  assert(
    (await accessibleProjectIds(OWNER_ID)).includes(PROJECT_ID),
    "Owner ADMIN membership does not grant project visibility",
  );
  assert(
    (await accessibleProjectIds(MEMBER_ID)).includes(PROJECT_ID),
    "MEMBER membership does not grant project visibility",
  );
  assert(
    !(await accessibleProjectIds(STRANGER_ID)).includes(PROJECT_ID),
    "Stranger can see a project without membership",
  );

  const activeAdmins = await prisma.projectMember.count({
    where: { projectId: PROJECT_ID, role: "ADMIN", status: "ACTIVE" },
  });
  assert(
    activeAdmins === 1,
    "Verification project must have exactly one admin",
  );
  assert(
    ownerMembership.role === "ADMIN",
    "Project creator membership must remain ADMIN",
  );

  const progressBefore = await prisma.lessonProgress.count({
    where: { memberId: memberMembership.id },
  });
  await prisma.projectMember.update({
    where: { id: memberMembership.id },
    data: { status: "REMOVED" },
  });
  assert(
    !(await accessibleProjectIds(MEMBER_ID)).includes(PROJECT_ID),
    "REMOVED membership still grants project visibility",
  );
  const reactivated = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: PROJECT_ID, userId: MEMBER_ID } },
    update: { status: "ACTIVE", joinedAt: new Date() },
    create: {
      projectId: PROJECT_ID,
      userId: MEMBER_ID,
      role: "MEMBER",
      source: "GITHUB",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
  });
  const progressAfter = await prisma.lessonProgress.count({
    where: { memberId: reactivated.id },
  });
  assert(
    reactivated.id === memberMembership.id,
    "Reactivation created a duplicate membership",
  );
  assert(
    progressAfter === progressBefore,
    "Reactivation did not preserve lesson progress",
  );

  console.log("Membership-only visibility: passed");
  console.log("Stranger isolation: passed");
  console.log("Single-admin guard precondition: passed");
  console.log("Soft-delete reactivation with progress preservation: passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
