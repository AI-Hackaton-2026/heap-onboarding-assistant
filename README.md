# Onboardly 🚀

> **AI Onboarding Assistant** that actually gets used — grounded in your company's Slack, GitHub, and internal docs.

Built by **Team Heap** for the **FEP AI Hackathon 2026** (Theme 9 — AI Onboarding Assistant).

---

## The Problem

New employees need a lot of information in their first weeks, and finding the right resource, process, or person is slow and frustrating. Managers and colleagues answer the same questions over and over. Onboarding lives in the heads of a few people — it doesn't scale, and every new hire gets a different experience.

## What Onboardly Does

Onboardly is a conversational AI assistant that:

1. **Generates a personalized onboarding plan** from a role and department — a developer gets a different plan than someone in HR.
2. **Answers questions in natural language** using the company's real documents, and **cites its sources** so answers are verifiable — no hallucinations.
3. **Tracks progress** through an interactive checklist, and surfaces to HR where new hires get stuck.

The core idea: instead of a chatbot that makes things up, Onboardly uses **RAG (Retrieval-Augmented Generation)** over the company's actual knowledge — so every answer is grounded and traceable.

---

## Features

| Feature | Description | Priority |
| --- | --- | --- |
| 🗓️ **Onboarding Plan Generator** | Enter a role + department → AI returns a structured plan (Day 1 / Week 1 / Weeks 2–4) as typed JSON. Role-specific. | MUST |
| 💬 **RAG Chat Assistant** | Ask anything ("How do I request leave?", "What's our branching strategy?"). AI retrieves relevant chunks and answers **with a cited source** (e.g. `[GitHub: backend/README.md]`). | MUST |
| ✅ **Progress Checklist** | Plan items become an interactive checklist with a progress bar. State is persisted per session. | MUST |
| 🗺️ **Guided Conversational Flow** | The assistant proactively suggests the next logical step from the plan — the user doesn't need to know what to ask. | MUST |
| 💾 **Context Memory** | Remembers the user's role and progress across the session, so they never repeat themselves. | MUST |
| 👤 **"Who do I ask?"** | Matches a question to the right person from the Slack org chart, and can draft an intro message. | SHOULD |
| 📊 **HR Dashboard** | Overview of new hires, completion %, most-asked questions, and bottleneck topics. | STRETCH |
| 🎓 **Knowledge Gap Alert** | When the AI can't find an answer, it logs the gap so HR knows which docs are missing. | STRETCH |

---

## Architecture

```
  Slack API ─┐
  GitHub API ─┼─→ Ingestion & Chunking ─→ Embeddings (Gemini) ─→ Vector Store (Supabase pgvector)
  HR Docs ───┘

  User enters role ─→ LLM (Gemini) ─→ ┌─ 📋 Onboarding Plan
                                       ├─ 💬 Chat with citations
                                       └─ 📊 HR Dashboard
```

Onboardly is a **single Next.js (App Router) full-stack app** — the UI and the API routes live in one TypeScript codebase and deploy together to Vercel.

### How RAG works (no hallucinations)

```
User asks "How do we deploy?"
    → embed the question
    → retrieve top-3 chunks from the vector store
    → LLM receives: prompt + retrieved context
    → answer + [Source: repo/README.md]
```

The model **only answers from retrieved documents**. If it can't find a relevant answer, it says so ("I couldn't find this in the company documents") rather than guessing.

> **Note on data sources:** For early development, Slack and GitHub content is simulated with mock data under `src/data/mock/`. The integration helpers under `src/lib/github` and `src/lib/slack` start as placeholders and are swapped for real Slack/GitHub sync once those integrations are wired — no architectural change needed.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router) — single full-stack app (UI + API routes) |
| Language | TypeScript |
| Styling / UI | Tailwind CSS + shadcn/ui (semantic theme tokens, light/dark) |
| Database | Supabase (Postgres + pgvector) |
| Auth / Storage | Supabase Auth (GitHub + Email), Supabase Storage |
| AI / RAG | Google Gemini 2.5 (LLM) + Gemini Embeddings, retrieval over pgvector |
| Integrations | GitHub App, Slack App (mock data for early dev) |
| Tooling | ESLint, Prettier |
| Deploy | Vercel (one deployment) |

---

## Project Structure

```
heap-onboarding-assistant/        # repo root (project meta)
├── context/                      # specs, roadmap, workflow docs
├── README.md                     # this file
└── onboardly/                    # the Next.js app — run npm commands here
    ├── src/
    │   ├── app/
    │   │   ├── (public)/page.tsx          # landing / welcome
    │   │   ├── (auth)/                    # authenticated pages
    │   │   │   ├── dashboard/page.tsx
    │   │   │   ├── projects/…             # list, [projectId], course, chat, admin
    │   │   │   └── integrations/page.tsx
    │   │   └── api/                       # projects, github/sync, slack/sync,
    │   │       └── …                      # documents/upload, knowledge/generate, chat, course/generate
    │   ├── components/
    │   │   ├── layout/                    # AppShell, headers, Sidebar
    │   │   └── ui/                        # shadcn/ui primitives + EmptyState
    │   ├── lib/
    │   │   ├── supabase/{client,server}.ts
    │   │   ├── ai/gemini.ts
    │   │   ├── github/ · slack/ · documents/ · rag/ · course/
    │   ├── types/                         # database, project, course, chat, integrations
    │   └── data/mock/                     # projects, course, chat, knowledge
    ├── .env.example
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Gemini API key (for the LLM + embeddings)
- A Supabase project (URL + keys) — optional for the initial structure scaffold, which renders without real credentials

### Run the app

The app lives in the `onboardly/` subfolder — run commands from there:

```bash
cd onboardly
npm install
cp .env.example .env.local        # then fill in your keys (see below)
npm run dev
```

The app is now at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# GitHub Integration
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=

# Slack Integration
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ Never commit real API keys. `.env.local` is gitignored; only `.env.example` is tracked.

---

## API Endpoints

API routes live under `src/app/api/*`. The initial scaffold ships these as placeholders (simple JSON responses) to be filled in as features land:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/projects` | Create or list projects. |
| `POST` | `/api/github/sync` | Sync a GitHub repo into the knowledge base. |
| `POST` | `/api/slack/sync` | Sync a Slack workspace into the knowledge base. |
| `POST` | `/api/documents/upload` | Upload + extract text from manual documents. |
| `POST` | `/api/knowledge/generate` | Chunk, embed, and store the project knowledge base. |
| `POST` | `/api/chat` | RAG answer to a question, with cited sources. |
| `POST` | `/api/course/generate` | Generate an onboarding course (modules, lessons, checklist, quiz). |

**Example — placeholder call:**

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" -d '{}'
```

```json
{ "message": "Project API placeholder" }
```

---

## Demo Flow

1. **Wizard** — enter name, role, and department → backend generates the plan as structured JSON.
2. **Plan + Checklist** — the plan renders as a day-by-day accordion; each task has a checkbox and the progress bar updates live.
3. **Chat** — ask free-form questions; the assistant retrieves from the knowledge base and answers with a `[Source: ...]` citation, aware of your role and progress.

---

## Team

**Heap** — 5 members.

| Name | Role |
| --- | --- |
| _TBD_ | Backend / RAG pipeline |
| _TBD_ | Frontend / UI |
| _TBD_ | Integrations (Slack / GitHub) |
| _TBD_ | Plan generation + HR view |
| _TBD_ | Demo / presentation |

---

## Acknowledgements

Built in ~15 hours for the **FEP AI Hackathon 2026** (Jun 2–3, 2026). AI tools (Claude, Copilot) were used for brainstorming, coding assistance, and debugging — the team understands and can explain the full implementation.
