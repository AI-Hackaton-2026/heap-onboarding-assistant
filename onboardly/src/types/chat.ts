// Chat and chat message types for the RAG assistant.

import type { ISODateString, UUID } from "./database";

export type ChatRole = "user" | "assistant" | "system";

/** A cited source backing an assistant answer (file path, doc, or Slack channel). */
export interface Citation {
  /** Human-readable label, e.g. "GitHub: backend/README.md". */
  label: string;
  /** Underlying path / URL / channel reference. */
  source: string;
}

export interface ChatMessage {
  id: UUID;
  role: ChatRole;
  content: string;
  citations?: Citation[];
  createdAt?: ISODateString;
}

export interface Chat {
  id: UUID;
  projectId: UUID;
  messages: ChatMessage[];
}
