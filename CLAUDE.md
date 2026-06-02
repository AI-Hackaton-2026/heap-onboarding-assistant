# Onboardly

An AI onboarding assistant that actually gets used — grounded in your company's Slack, GitHub, and internal docs (RAG with cited sources).

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

This is a single **Next.js full-stack app** (App Router, TypeScript, Tailwind) — one codebase, one deployment. Run from the project root.

- **Install**: `npm install`
- **Dev server**: `npm run dev`  (http://localhost:3000)
- **Build**: `npm run build`
- **Production start**: `npm run start`
- **Lint**: `npm run lint`

**IMPORTANT:** Do not add Claude to any commit messages

<!--
  Project-specific rules:
  - All keys (Supabase, Gemini, GitHub, Slack) come from env; never hardcode them. See `.env.example`.
  - GitHub/Slack/RAG/course logic starts as placeholders under `src/lib/*`; use mock data in `src/data/mock` for early frontend work.
  - Supabase (pgvector) is the vector store; Gemini is the LLM/embeddings provider.
-->
