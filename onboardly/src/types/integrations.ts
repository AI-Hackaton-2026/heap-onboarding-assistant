// GitHub and Slack integration types.

import type { ISODateString, UUID } from "./database";

export type IntegrationProvider = "github" | "slack";
export type IntegrationStatus =
  | "disconnected"
  | "connected"
  | "syncing"
  | "error";

export interface Integration {
  id: UUID;
  projectId: UUID;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  /** Provider-specific connection reference (installation id, workspace id, etc.). */
  externalId: string | null;
  lastSyncedAt: ISODateString | null;
}
