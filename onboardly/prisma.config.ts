// Prisma 7 configuration.
//
// In Prisma 7 the connection URL and migrations config live here (not in
// schema.prisma). This `datasource.url` is what the Prisma CLI (`migrate`,
// `db push`, `studio`) connects with — so it must be the DIRECT connection
// (session-mode pooler, port 5432), since migrations can't run through
// pgbouncer's transaction mode.
//
// The application RUNTIME does not use this URL — it uses the pg driver
// adapter in src/lib/db/prisma.ts, which connects with the pooled
// DATABASE_URL (transaction-mode pooler, port 6543, ?pgbouncer=true).

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma CLI runs outside Next.js, so it doesn't auto-load .env.local.
// Load it explicitly (falling back to .env) so DIRECT_URL resolves.
config({ path: ".env.local" });
config();

type Env = {
  DIRECT_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (non-pgbouncer) connection used by `prisma migrate` / `db push`.
    url: env<Env>("DIRECT_URL"),
  },
});
