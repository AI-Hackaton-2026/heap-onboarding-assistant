// Shared database-related types. Mirrors the Supabase Postgres schema
// (see context/roadmap.md Phase 1). Generated Supabase types can replace
// the `Database` placeholder later via `supabase gen types`.

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
