// Shared database-related types. Generated Supabase types can replace the
// `Database` placeholder later via `supabase gen types`.

export type UUID = string;
export type ISODateString = string;

/** Status of a project's knowledge base / ingestion pipeline. */
export type KnowledgeStatus =
  | "empty"
  | "syncing"
  | "building"
  | "ready"
  | "error";

/** Placeholder for the generated Supabase `Database` type. */
export type Database = Record<string, unknown>;
