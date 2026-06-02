# AI Chat (RAG Pipeline) Spec

## Overview

Wire the existing placeholder `POST /api/chat` route into a working RAG chatbot:
embed the user's question with Gemini, run a pgvector similarity search scoped to the
project, build a context-rich prompt, call Gemini 2.5 Flash, persist both turns to the
DB, and return the answer with citations. Replace the disabled mock UI in
`[projectId]/chat/page.tsx` with a live, interactive composer.

## Requirements

- `POST /api/chat` accepts `{ message, projectId, chatId? }` — creates a new chat
  session when `chatId` is absent, returns `{ answer, citations, chatId }`.
- User identity comes from the Supabase server session; reject 401 if unauthenticated.
- Every request embeds the question via Gemini `text-embedding-004` (768 dims).
- pgvector similarity search is scoped by `projectId` — returns top-5 chunks with
  `source_label` as citation label.
- If no embeddings exist for the project yet, return a graceful answer explaining
  that the knowledge base is empty, with no citations — do not throw.
- Gemini 2.5 Flash receives: system prompt (role context) + retrieved chunks as
  context + last 10 messages from DB as history + the new user question.
- Both turns (user + assistant) are written to `chat_messages` inside a single
  Prisma transaction after the LLM responds.
- Citations are stored as `Json` on the assistant `chat_messages` row and echoed
  in the API response.
- `chat/page.tsx` becomes a client component with local `messages` state, an active
  text input, a Send button, streaming-ready message list, and citation badges under
  each assistant bubble.
- Loading state: disable input + show a "..." typing bubble while awaiting the API.
- Graceful error: if the API returns non-200, show an inline error message in the
  chat thread (do not throw to an error boundary).

## Files to Create

- `onboardly/src/app/api/chat/route.ts` — replace placeholder; full RAG handler
- `onboardly/src/lib/rag/embeddings.ts` — implement `embedQuery(text)` + `embedChunks(texts[])` via Gemini SDK
- `onboardly/src/lib/rag/search.ts` — implement `searchKnowledge(query, projectId, topK)` via raw SQL pgvector

## Files to Modify

- `onboardly/src/app/(auth)/projects/[projectId]/chat/page.tsx` — replace static mock with live client component
- `onboardly/src/lib/rag/embeddings.ts` — was a stub that throws; now real

## Key Gotchas

- **`@google/genai` v2 embedding API** — use `ai.models.embedContent({ model, contents: text })`;
  the result shape is `result.embeddings[0].values` (array of floats). Double-check
  against the installed version's types before assuming — the v2 SDK changed the response shape from v1.
- **pgvector raw SQL** — Prisma does not support the `<=>` operator; use
  `prisma.$queryRaw<Row[]>(Prisma.sql\`SELECT ... FROM embeddings WHERE project_id = ${projectId}::uuid ORDER BY embedding <=> ${vector}::vector LIMIT ${topK}\`)`.
  The vector must be passed as a Postgres literal string `[0.1,0.2,...]`, not a JS array.
- **No RLS** — Prisma connects as `postgres` and bypasses Row Level Security.
  Every query MUST be scoped by `projectId` manually. Never fetch embeddings or
  messages without a `projectId` (or `chatId`) filter.
- **Chat history size** — fetch the last 10 messages from DB to keep the prompt under
  token limits. Do not send the full history for long sessions.
- **Gemini stateless** — `gemini-2.5-flash` via `generateContent` is stateless; manually
  build the `contents` array as `[{role, parts:[{text}]}, ...]` from DB history +
  the new user message.
- **Empty knowledge base** — `searchKnowledge` returns `[]` when no embeddings exist.
  The route must handle this without erroring: pass an empty context block to Gemini
  and note in the system prompt that no documents have been indexed yet.
- **`userId` from Supabase** — use `createServerClient` from `@/lib/supabase/server`
  and call `.auth.getUser()`; the returned `user.id` is the UUID for `Chat.userId`.
- **Transaction for persistence** — write both `chat_messages` rows (user + assistant)
  in one `prisma.$transaction([...])` call after the LLM responds, so a failed write
  does not leave a dangling user message with no reply.
- **Prisma `ChatRole` enum** — DB uses `USER` / `ASSISTANT` (uppercase); the TS type in
  `src/types/chat.ts` uses `"user"` / `"assistant"` (lowercase). Map between them at
  the API boundary.

## Environment Variables

- `GEMINI_API_KEY` — already in `.env.example`; must be present in `.env.local`.
  No new vars needed — Supabase + Prisma URLs are already wired.

## Testing

- Start dev server: `cd onboardly && npm run dev`
- Open `/projects/<any-projectId>/chat` — input and Send button must be enabled.
- Send "Hello" (no embeddings yet) — expect a graceful "knowledge base is empty" reply with no citations.
- Curl smoke test:
  ```bash
  curl -s -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Hello","projectId":"<uuid>"}' | jq .
  ```
  Expect `{ answer: "...", citations: [], chatId: "<uuid>" }` — not `{ message: "Chat placeholder" }`.
- After indexing a document (future feature), send a relevant question and verify
  `citations` array contains at least one entry with a non-empty `label` and `source`.
- Check Supabase dashboard → `chats` + `chat_messages` tables: two rows created per
  round-trip (one `USER`, one `ASSISTANT`).

## References

- `onboardly/src/lib/ai/gemini.ts` — `getGemini()` client + model constants
- `onboardly/src/lib/rag/chunk.ts` — existing chunking util (model for style)
- `onboardly/src/types/chat.ts` — `ChatMessage`, `Citation`, `Chat` types
- `onboardly/prisma/schema.prisma` — `Chat`, `ChatMessage`, `Embedding` table shapes
- `onboardly/src/lib/supabase/server.ts` — server-side Supabase client (for `getUser`)
- `onboardly/src/lib/db/prisma.ts` — Prisma singleton
- `onboardly/src/data/mock/chat.ts` — current mock data (replace in chat page, keep file)
