// One-off verification for the T-MEM-1 schema push + B1 owner backfill.
// Run with: npx tsx scripts/verify-members-schema.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name IN ('user_profiles','project_members','lesson_progress')
    ORDER BY table_name;
  `);
  console.log(
    "New tables:",
    tables.map((t) => t.table_name).join(", ") || "(none)",
  );

  const enums = await prisma.$queryRawUnsafe<{ enum: string; values: string }[]>(`
    SELECT t.typname AS enum, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS values
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname IN ('project_role','member_source','member_status','progress_status')
    GROUP BY t.typname ORDER BY t.typname;
  `);
  for (const e of enums) console.log(`  enum ${e.enum}: ${e.values}`);

  const uniques = await prisma.$queryRawUnsafe<{ tbl: string; conname: string }[]>(`
    SELECT conrelid::regclass::text AS tbl, conname
    FROM pg_constraint
    WHERE contype='u' AND conrelid::regclass::text IN ('project_members','lesson_progress','user_profiles')
    ORDER BY tbl, conname;
  `);
  console.log("Unique constraints:");
  for (const u of uniques) console.log(`  ${u.tbl}: ${u.conname}`);

  const counts = {
    organizations: await prisma.organization.count(),
    projects: await prisma.project.count(),
    project_members: await prisma.projectMember.count(),
    user_profiles: await prisma.userProfile.count(),
  };
  console.log("Row counts:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
