# Current Feature

## Status

Not Started

## Goals

<!-- Bullet points of what success looks like (populated by `/feature load`) -->

## Notes

<!-- Additional context, constraints, or details from the spec -->

## History

### Initialize Project Structure

Scaffolded Onboardly as a single **Next.js (App Router) full-stack app** in the `onboardly/` subfolder — TypeScript, Tailwind v4, shadcn/ui (radix-nova), ESLint + Prettier. Also pivoted all project context to the new stack (Next.js + Supabase + Gemini, away from the old FastAPI + Vite + FAISS plan) and captured the full 13-phase build plan in `context/roadmap.md`.

- **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Supabase (`@supabase/ssr`) · Gemini (`@google/genai`).
- **App tree (`onboardly/src`):** `(public)` landing + `(auth)` dashboard/projects/`[projectId]`(overview, course, chat, admin)/integrations behind an `AppShell`; 7 placeholder API routes; lib placeholders (supabase, ai/gemini, github, slack, documents, rag, course); shared types; mock data.
- **Layout:** app lives in `onboardly/`; repo root holds project meta + top-level `README.md`.
- **Context updates:** CLAUDE.md, project-overview.md, coding-standards.md, README.md, ai-interaction.md updated to the new stack; `context/roadmap.md` added.
- **Verified:** `eslint` and `next build` pass with no real credentials; all routes render (pages 200, API routes return placeholder JSON). Fixed a `setAll` implicit-any in the Supabase server client and removed a deprecated `baseUrl` from tsconfig.
