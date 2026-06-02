# Onboardly

An AI onboarding assistant that actually gets used — grounded in your company's Slack, GitHub, and internal docs (RAG with cited sources).

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/roadmap.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

This is a single **Next.js full-stack app** (App Router, TypeScript, Tailwind) — one codebase, one deployment. The app lives in the **`onboardly/`** subfolder; the repo root holds project meta (`context/`, `.claude/`, top-level `README.md`). Run all app commands from inside `onboardly/`.

```bash
cd onboardly
```

- **Install**: `npm install`
- **Dev server**: `npm run dev`  (http://localhost:3000)
- **Build**: `npm run build`
- **Production start**: `npm run start`
- **Lint**: `npm run lint`
- **Format**: `npm run format`

**IMPORTANT:** Do not add Claude to any commit messages

<!--
  Project-specific rules:
  - Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; Supabase (Postgres/pgvector, Auth, Storage); Gemini 2.5 + Gemini Embeddings; GitHub App + Slack App.
  - All keys (Supabase, Gemini, GitHub, Slack) come from env; never hardcode them. See `.env.example`.
  - shadcn/ui is the component layer; add primitives via the shadcn CLI into `src/components/ui`. Tailwind v4 (`@theme` in CSS, no tailwind.config.js).
  - Prettier formats; ESLint lints. Run both before committing.
  - GitHub/Slack/RAG/course logic starts as placeholders under `src/lib/*`; use mock data in `src/data/mock` for early frontend work.
  - The authoritative 13-phase build plan + DB schema live in `context/roadmap.md`.
-->
