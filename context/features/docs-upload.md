# Document Upload (T-DOC-1 + T-DOC-2) Spec

> **Owner:** Dželila · **Phase 4** (Documentation Upload) · Builds on Phase 2
> (projects + membership). **Stops before embeddings** — `T-EMB-1` (Gemini →
> pgvector) is the next task and consumes the `DocumentChunk` rows this produces.

## Overview

Let a project **admin** upload company docs (PDF / Markdown / DOCX / TXT) to a
project. The original file goes to **Supabase Storage**; we extract its text into
a `Document` row and split that text into ordered `DocumentChunk` rows (each with
a citation label). **All project members can view/download** the doc list; only
**admins** can upload or delete. This is the "raw knowledge in" step — it makes
documents storable and chunked so a later task can embed the chunks for RAG.

## Where things are saved (decided)

- **Original file → Supabase Storage**, bucket **`uploads`**, keyed by project
  (e.g. `uploads/{projectId}/{uuid}-{filename}`). Path saved to
  `Document.storagePath`.
- **Parsed text + metadata → `documents` table** (`source = UPLOAD`, `rawText`,
  `mimeType`, `title`, `metadata`).
- **Chunks → `document_chunks` table** (`chunkIndex`, `content`, `citation`).
  Chunking *is* correct here: RAG retrieves chunks (not whole files), and the
  per-chunk `citation` is what powers source attribution later. **Do not embed
  yet** — leave `embeddings` empty for `T-EMB-1`.

## Requirements

- **Admin-gated writes / member-readable reads** — every upload/delete server
  action calls `requireProjectAdmin(projectId)`; the list/download path calls
  `getProjectAccess(projectId)` (any ACTIVE member can read). Reuse
  `src/lib/members/access.ts` — same pattern as `connection-actions.ts` /
  `members/actions.ts`. Hiding the upload button is **not** the security boundary;
  the server re-check is (Prisma bypasses RLS).
- **Supabase Storage** — ensure the **`uploads`** bucket exists (private). Use the
  **server** Supabase client (service role) for the upload/delete/signed-URL —
  never the browser client. Add a small storage helper under
  `src/lib/supabase/` rather than inlining bucket calls.
- **Accepted formats:** `.pdf`, `.md`, `.docx`, `.txt`. Validate by extension
  **and** MIME type; reject anything else with a clear error. Enforce a max file
  size (e.g. 10 MB) server-side.
- **Parse → text** (`src/lib/documents/*`, replace the `ingest.ts` placeholder):
  - PDF → `pdf-parse` (or similar)
  - DOCX → `mammoth` (raw text extraction)
  - MD / TXT → read as UTF-8 (strip nothing; keep raw)
  - Store the extracted text in `Document.rawText`. If a file yields no
    extractable text, save the `Document` but with `rawText = null` and surface a
    "couldn't extract text" notice (don't hard-fail the upload).
- **Chunk** — split `rawText` into ordered chunks (target ~1000 chars /
  ~200-char overlap, or token-approx; keep it simple and deterministic). Persist
  `DocumentChunk` rows with `chunkIndex` (0-based) and a **`citation`** label like
  `"Upload: {title}#chunk{chunkIndex}"` (final citation format can be refined in
  `T-KB-1`; just make it human-readable and stable).
- **Atomicity / cleanup** — if parsing or DB writes fail after the file lands in
  Storage, delete the orphaned Storage object (or wrap doc + chunk inserts in a
  Prisma transaction and clean up Storage on failure). No orphaned files, no
  `Document` rows without their file.
- **Delete** — deleting a `Document` (admin only) removes its Storage object and
  cascades its `DocumentChunk` rows (FK is `onDelete: Cascade`).
- **Tenant isolation** — every query scoped through the project access guard; a
  user with no membership on the project gets nothing (list returns `[]`, actions
  throw). Mirror the existing members/projects query scoping.
- **Responsive UI (390 / 768 / 1440)**, shadcn/ui + semantic tokens only, light +
  dark. Upload control is admin-only; the list renders for all members.

## Files to Create / Touch

- `src/lib/supabase/storage.ts` *(new)* — upload / delete / signed-download
  helpers for the `uploads` bucket (server client only).
- `src/lib/documents/parse.ts` *(new)* — `extractText(file, mimeType)` dispatch
  for PDF / DOCX / MD / TXT.
- `src/lib/documents/chunk.ts` *(new)* — `chunkText(text)` → `{ index, content }[]`.
- `src/lib/documents/actions.ts` *(new)* — `uploadDocument` / `deleteDocument`
  server actions (admin-gated). Replaces the `ingest.ts` placeholder
  responsibility; delete `ingest.ts` or fold it in.
- `src/lib/documents/queries.ts` *(new)* — `listDocuments(projectId)` (member-
  readable, scoped) + `getDownloadUrl(documentId)`.
- `src/app/api/documents/upload/route.ts` *(exists as stub)* — wire the upload
  handler (multipart). Validate body/file before use; return clear HTTP codes.
- `src/app/(auth)/projects/[projectId]/documents/page.tsx` *(new)* — docs list +
  admin upload control + per-doc delete/download. `force-dynamic`, behind the
  existing `(auth)` guard.
- `src/components/documents/*` *(new)* — `DocumentUpload` (client, admin-only),
  `DocumentList` / `DocumentRow` (status, type badge, size, uploaded-at,
  download, admin delete).
- Add a **"Documents"** entry point on the project overview / sidebar (mirror how
  Members/Integrations are linked).

## Key Gotchas

- **Server-only parsing.** `pdf-parse` / `mammoth` are Node libs — the upload
  route/action must run on the **Node runtime** (not Edge). Never parse in a
  client component.
- **`source` enum value is `UPLOAD`** (`DocSource`), and `Document.storagePath` /
  `mimeType` / `rawText` already exist in the schema — **no schema change /
  `db push` needed** for this slice.
- **Don't touch `embeddings`.** Chunks are written without vectors; `T-EMB-1`
  backfills them. Keep the chunker output shape easy for that task to consume.
- Use the **service-role server client** for Storage; the bucket is private, so
  downloads go through a short-lived **signed URL** generated server-side, never a
  public URL.
- Validate MIME **and** extension — a `.pdf` with a bogus content-type, or a
  renamed binary, must be rejected.

## Testing

- As an **admin**: upload one of each format (PDF, MD, DOCX, TXT) → file appears
  in Storage `uploads/{projectId}/…`, a `Document` row exists with `rawText`
  populated, and `DocumentChunk` rows exist with sequential `chunkIndex`.
- As a **non-admin member**: the list/download works, but no upload/delete
  control is shown **and** calling the action directly is rejected by
  `requireProjectAdmin`.
- A user with **no membership** on the project sees nothing (empty list / blocked).
- Reject an unsupported format and an over-size file with a clear error.
- Delete a document → Storage object gone, chunks cascade-deleted.
- `npm run lint` + `npm run build` pass; verify the page at **390 / 768 / 1440**,
  light + dark.

## References

- Schema: `prisma/schema.prisma` → `Document`, `DocumentChunk`, `Embedding`,
  `DocSource` (already present).
- Access guards to reuse: `src/lib/members/access.ts`
  (`requireProjectAdmin`, `getProjectAccess`) — same usage as
  `src/lib/projects/connection-actions.ts` and `src/lib/members/actions.ts`.
- Storage spec: buckets `docs` / `uploads`, roadmap **Phase 4** + Supabase
  Integration Tasks in `context/roadmap.md`.
- Tasks board: `T-DOC-1` + `T-DOC-2` in `context/tasks.md`. Next task that
  consumes this: `T-EMB-1` (embeddings).
