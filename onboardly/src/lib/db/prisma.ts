// Prisma client singleton.
//
// Uses the pg driver adapter against Supabase's transaction-mode pooler
// (DATABASE_URL with ?pgbouncer=true). A global cache prevents exhausting
// connections during Next.js dev hot-reload.
//
// NOTE: Prisma connects as the `postgres` role and bypasses Supabase RLS —
// always scope queries by the authenticated user's organization in app logic.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
