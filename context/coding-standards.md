# Coding Standards

This is a single-stack project: a **Next.js (App Router) full-stack app** written entirely in **TypeScript**. UI and backend (API routes) live in one codebase under `src/`.

## TypeScript

- Strict mode enabled; no `any` — use proper typing or `unknown`.
- Type hints / explicit return types on exported functions and API handlers.
- Define interfaces for all props, API request/response bodies, and data models; keep shared types under `src/types`.
- Use type inference where obvious, explicit types where helpful.
- Never hardcode secrets — read keys from environment (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, GitHub/Slack keys, etc.). See `.env.example`.

## React / Next.js (App Router)

- Function components with hooks; no class components.
- Default to Server Components; add `"use client"` only when a component needs interactivity or browser APIs.
- Keep business/data logic out of page components — put reusable logic under `src/lib` and call it from routes/handlers.
- Lift shared session state (role, progress) to a context/provider rather than prop-drilling.
- Server-side data access (Supabase, Gemini, integrations) belongs in API routes (`src/app/api/*`) or server utilities under `src/lib`, never in client components.

## Styling — Tailwind CSS

- Use Tailwind utility classes; avoid bespoke CSS files unless a utility truly can't express it.
- Theme via **semantic theme tokens** so light/dark works globally; components reference tokens (e.g. `bg-surface`, `text-foreground`), not raw colors.
- Note any version-specific config gotchas here once Tailwind is installed (e.g. v4 uses `@theme` in CSS, not `tailwind.config.js`).

## File Organization

- App routes & pages: `src/app/` — `(public)` route group for public pages, `(auth)` route group for authenticated pages.
- API routes: `src/app/api/<area>/route.ts`.
- Shared UI: `src/components/ui/` (Button, Card, Badge, Input, EmptyState); layout shells: `src/components/layout/`.
- Server/client utilities: `src/lib/` — `supabase/{client,server}.ts`, `ai/gemini.ts`, `github/*`, `slack/*`, `documents/*`, `rag/*`, `course/*`.
- Shared types: `src/types/` (`database`, `project`, `course`, `chat`, `integrations`).
- Mock data: `src/data/mock/` (kept separate from production logic).

## Naming

- React components: PascalCase (`PlanChecklist.tsx`)
- Functions / variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types / Interfaces: PascalCase (no prefix)

## Data / Vector Store

- Supabase (Postgres + **pgvector**) is the vector store. Embeddings are generated via Gemini and stored as pgvector rows.
- Retrieval returns top-k chunks; always carry the source label through to the answer so citations are accurate.

## Data Fetching

- Client components talk to the backend only through the app's own API routes (`src/app/api/*`) or typed helpers in `src/lib`; no ad-hoc `fetch` to third parties from the client.
- Validate all inbound request bodies in API routes before use; never trust client input.

## Error Handling

- API routes: return clear HTTP status codes + JSON error messages; catch and log RAG/LLM/integration failures.
- The chat endpoint must degrade gracefully — when no relevant chunk is found, return an honest "not found in company documents" answer rather than a hallucination.
- Frontend: surface user-friendly errors; never leave the UI in a silent failed state.

## Code Quality

- No commented-out code unless specified.
- No unused imports or variables; no stray `console.log` debugging left in.
- Keep functions focused and under ~50 lines when possible.
- Every placeholder file created during scaffolding should include a short comment explaining its purpose.
