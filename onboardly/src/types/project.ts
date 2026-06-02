// Project and organization types.

import type { ISODateString, KnowledgeStatus, UUID } from "./database";

export interface Organization {
  id: UUID;
  name: string;
  createdAt: ISODateString;
}

export interface Project {
  id: UUID;
  name: string;
  description: string;
  /** e.g. "heap/onboardly" */
  githubRepo: string | null;
  /** e.g. "Heap Team" */
  slackWorkspace: string | null;
  knowledgeStatus: KnowledgeStatus;
  createdAt: ISODateString;
}
