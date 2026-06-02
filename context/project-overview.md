## Onboardly Project Specifications

> An AI onboarding assistant that actually gets used — grounded in your company's Slack, GitHub, and internal docs.

---

## 📌 Problem (Core Idea)

New employees need a lot of information in their first weeks, and finding the right resource, process, or person is slow and frustrating. Managers and colleagues answer the same questions repeatedly. Onboarding lives in the heads of a few people — it doesn't scale, and every new hire gets a different experience.

➡️ **A conversational, RAG-grounded assistant that generates a personalized onboarding plan, answers questions from the company's real documents with cited sources, and tracks progress — so every answer is verifiable and every hire gets a consistent experience.**

---

## 🧑‍💻 Users

| Persona | Needs |
| ------- | ----- |
| New hire (e.g. Backend Developer) | A role-specific plan, fast answers grounded in real docs, knowing who to ask, and a sense of progress. |
| HR / People Ops | Visibility into where hires get stuck, most-asked questions, and which docs are missing (knowledge gaps). |

---

## ✨ Core Features

- **Project & Org Management** (MUST) — admins create organizations and projects (name, description, GitHub repo, Slack workspace, status).
- **Knowledge Ingestion** (MUST) — connect GitHub + Slack and upload docs (PDF/MD/DOCX/TXT) → parse → chunk → embed into pgvector, with a unified knowledge base + citations.
- **Course Generator** (MUST) — free-text role → AI-generated course: modules, lessons, checklists, quizzes, estimated duration; admin-editable.
- **Course UI** (MUST) — Anthropic-Academy-style sidebar (modules + progress), lesson page (content, checklist, quiz), progress tracking.
- **RAG Chat Assistant** (MUST) — retrieves relevant chunks and answers with a cited source (file / doc / Slack); says "I couldn't find this" rather than guessing.
- **Ownership Detection** (SHOULD) — analyzes commits/PRs/discussions to surface feature owners + most active contributors ("who do I ask?").
- **AI Message Generation** (SHOULD) — drafts a professional intro/question message to the right owner, with citations.
- **Admin Dashboard** (SHOULD) — knowledge-base status (GitHub/Slack/embedding/course gen) + resync/rebuild controls.
- **Knowledge Graph** (STRETCH) — systems/components/relationships derived from the repo + docs.

See `context/roadmap.md` for the full phased breakdown of each feature.

---

## 🗄️ Data Model

> Starting point — will evolve.

```
OnboardingPlan
  days: Day[]
Day
  day: int
  title: string
  tasks: Task[]
Task
  id: string
  text: string
  done: bool

ChatMessage      { role, content, sources?: string[] }
Source           { label, path }        # e.g. "GitHub: backend/README.md"
Progress         { userId/session, taskId, done }
OrgContact       { name, role, channel, topics[] }   # derived from Slack data
DocChunk         { id, text, embedding, source }      # Supabase pgvector store
```

### Database Schema (Supabase Postgres)

Full table set (see `context/roadmap.md` Phase 1):

```
organizations        # tenant / company
projects             # name, description, github_repo, slack_workspace, status
documents            # uploaded + synced source docs (original + parsed text)
embeddings           # pgvector chunks with source citation
courses              # generated onboarding course per role
modules              # course → modules
lessons              # module → lessons (content)
checklist_items      # lesson checklists
quizzes              # lesson quizzes / questions
chats                # chat sessions
chat_messages        # role, content, citations
integrations         # GitHub App + Slack App connection state
```

RLS: organizations can only access their own projects. Storage buckets: `docs`, `uploads`.

---

## 🧱 Tech Stack

| Category | Choice |
| -------- | ------ |
| Framework | Next.js (App Router) — single full-stack app (UI + API routes) |
| Language | TypeScript across the whole project |
| Database | Supabase (Postgres + pgvector for embeddings) |
| Styling/UI | Tailwind CSS + **shadcn/ui** (semantic theme tokens, light/dark) |
| Auth | Supabase Auth — GitHub + Email login, protected routes (Phase 1) |
| Storage | Supabase Storage (buckets: `docs`, `uploads`) |
| Tooling | ESLint + Prettier |
| Deployment | Vercel (one deployment for UI + API) |

AI / RAG: Google **Gemini 2.5** as the LLM and **Gemini Embeddings** for vectors, retrieval over Supabase **pgvector**. Integrations: GitHub App + Slack App (logic starts as placeholders under `src/lib/*`; early frontend work uses mock data under `src/data/mock`).

> The full 13-phase build plan, ingestion architecture, and per-phase tasks live in **`context/roadmap.md`** (authoritative).

---

## 💰 Monetization (if any)

N/A — hackathon project.

---

## 🎨 UI / UX

- Three primary surfaces: Wizard (role/department entry), Plan + Checklist (day-by-day accordion with live progress), Chat (free-form Q&A with `[Source: ...]` citations).
- Answers must always show their source; the assistant must never fabricate when it can't find a match.
- Guided flow: the assistant suggests the next step so the user doesn't need to know what to ask.

---

## 🧭 Roadmap

Summarized below; the authoritative 13-phase plan is in `context/roadmap.md`.

### Foundation
- Project setup (Next.js, Tailwind, shadcn/ui, ESLint, Prettier), Supabase (Auth, Storage, pgvector), DB schema
- Org + project management

### Ingestion & Knowledge
- GitHub integration (App, repo sync, repo map/summaries)
- Documentation upload + parsing + chunking
- Slack integration (workspace sync, summaries)
- Embeddings + similarity search → unified knowledge base with citations

### Product Surfaces
- Course generator + course UI (modules, lessons, checklists, quizzes, progress)
- RAG chat assistant with citations

### Later
- Ownership detection + AI message generation
- Admin dashboard (sync status + resync/rebuild controls)
- Knowledge graph

---

## 📌 Status

New project. Being scaffolded as a single Next.js full-stack app (see `context/features/project-structure.md`). Source tree lives under `src/` (`src/app`, `src/components`, `src/lib`, `src/types`, `src/data/mock`).
