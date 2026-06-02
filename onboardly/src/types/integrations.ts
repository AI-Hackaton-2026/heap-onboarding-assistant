// Normalized GitHub and Slack project-connection types.

import type { ISODateString, UUID } from "./database";

export type ConnectionProvider = "GITHUB" | "SLACK";
export type ConnectionStatus = "DISCONNECTED" | "CONNECTED" | "ERROR";

export interface ProjectConnection {
  id: UUID;
  projectId: UUID;
  provider: ConnectionProvider;
  status: ConnectionStatus;
  /** Repo name or workspace reference. */
  externalRef: string | null;
  installationId: string | null;
  connectedAt: ISODateString | null;
}
