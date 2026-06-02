// Project and organization types. These mirror the Prisma models
// (Organization, Project, ProjectStatus); Prisma's generated types are the
// source of truth for DB reads — these stay for mock data and lib signatures.

import type { ISODateString, UUID } from "./database";

/** Mirrors Prisma's ProjectStatus enum. */
export type ProjectStatus = "DRAFT" | "SYNCING" | "READY" | "ERROR";

export interface Organization {
  id: UUID;
  name: string;
  createdAt: ISODateString;
}

export interface Project {
  id: UUID;
  name: string;
  description: string | null;
  /** e.g. "heap/onboardly" */
  githubRepo: string | null;
  /** e.g. "Heap Team" */
  slackWorkspace: string | null;
  status: ProjectStatus;
  createdAt: ISODateString;
}
