// Wipe all application rows while keeping the schema intact.
//
// Use this to clear fixture/demo junk (e.g. the placeholder 0000…000 owner) and
// start from an empty database. Tables are preserved — only their rows are
// removed — so unbuilt-phase tables stay in place for later work. No data is
// seeded back; you create your real user and project through the app.
//
// Run with:  npm run db:reset-data
//
// Destructive: this deletes every row in every application table. The Supabase
// `auth.users` table is NOT touched (it lives in the auth schema, not here), so
// your login accounts are preserved.

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local so DATABASE_URL is available when running outside Next.js.
config({ path: resolve(__dirname, "../.env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Every application table (snake_case @@map names from prisma/schema.prisma).
// TRUNCATE ... CASCADE clears them regardless of FK order in one statement.
const TABLES = [
  "message_citations",
  "chat_messages",
  "chats",
  "quizzes",
  "checklist_items",
  "lessons",
  "modules",
  "courses",
  "embeddings",
  "document_chunks",
  "documents",
  "sync_jobs",
  "project_connections",
  "project_members",
  "projects",
  "user_identities",
  "app_roles",
  "users",
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`,
  );

  console.log(`Truncated ${TABLES.length} tables. Database is empty.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
