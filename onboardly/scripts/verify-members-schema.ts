// Read-only verification for the normalized greenfield schema.
// Run with: npx tsx --env-file=.env.local scripts/verify-members-schema.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const expectedTables = [
    "app_roles",
    "chat_messages",
    "chats",
    "checklist_items",
    "courses",
    "document_chunks",
    "documents",
    "embeddings",
    "lesson_progress",
    "lessons",
    "message_citations",
    "modules",
    "project_connections",
    "project_members",
    "projects",
    "quizzes",
    "sync_jobs",
    "user_identities",
    "users",
  ];
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND table_type='BASE TABLE'
    ORDER BY table_name;
  `);
  const tableNames = tables.map((table) => table.table_name);
  console.log(`Tables (${tableNames.length}): ${tableNames.join(", ")}`);
  const missingTables = expectedTables.filter(
    (table) => !tableNames.includes(table),
  );
  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(", ")}`);
  }

  const enums = await prisma.$queryRawUnsafe<
    { enum: string; values: string }[]
  >(`
    SELECT t.typname AS enum, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS values
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname IN ('app_role_type','provider','project_status','project_role',
      'member_source','member_status','connection_status','sync_kind','sync_status',
      'doc_source','chat_role','progress_status')
    GROUP BY t.typname ORDER BY t.typname;
  `);
  for (const e of enums) console.log(`  enum ${e.enum}: ${e.values}`);

  const uniques = await prisma.$queryRawUnsafe<
    { tbl: string; indexname: string }[]
  >(`
    SELECT tablename AS tbl, indexname
    FROM pg_indexes
    WHERE schemaname='public'
      AND tablename IN
        ('project_members','lesson_progress','user_identities','project_connections')
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
    ORDER BY tbl, indexname;
  `);
  console.log("Unique indexes:");
  for (const unique of uniques)
    console.log(`  ${unique.tbl}: ${unique.indexname}`);
  const uniqueIndexNames = new Set(uniques.map((unique) => unique.indexname));
  const expectedUniqueIndexes = [
    "lesson_progress_lesson_id_member_id_key",
    "project_connections_project_id_provider_key",
    "project_members_project_id_user_id_key",
    "user_identities_provider_external_login_key",
    "user_identities_user_id_provider_key",
  ];
  const missingUniqueIndexes = expectedUniqueIndexes.filter(
    (index) => !uniqueIndexNames.has(index),
  );
  if (missingUniqueIndexes.length > 0) {
    throw new Error(
      `Missing unique indexes: ${missingUniqueIndexes.join(", ")}`,
    );
  }

  const vectorExtensions = await prisma.$queryRawUnsafe<{ extname: string }[]>(`
    SELECT extname FROM pg_extension WHERE extname='vector';
  `);
  if (vectorExtensions.length !== 1) {
    throw new Error("pgvector extension is missing");
  }
  console.log("pgvector extension: enabled");

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    project_members: await prisma.projectMember.count(),
    user_identities: await prisma.userIdentity.count(),
    project_connections: await prisma.projectConnection.count(),
  };
  console.log("Row counts:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
