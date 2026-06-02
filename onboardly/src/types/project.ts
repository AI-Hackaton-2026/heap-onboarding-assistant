// Project types. Prisma's generated types are the source of truth for DB reads;
// these stay for mock data and placeholder integration signatures.

import type { ISODateString, UUID } from "./database";

/** Mirrors Prisma's ProjectStatus enum. */
export type ProjectStatus = "DRAFT" | "SYNCING" | "READY" | "ERROR";

export interface Project {
  id: UUID;
  ownerId: UUID;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: ISODateString;
}
