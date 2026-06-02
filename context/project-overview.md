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

- **Onboarding Plan Generator** (MUST) — role + department → structured plan (Day 1 / Week 1 / Weeks 2–4) as typed JSON.
- **RAG Chat Assistant** (MUST) — retrieves relevant chunks and answers with a cited source (e.g. `[GitHub: backend/README.md]`); says "I couldn't find this" rather than guessing.
- **Progress Checklist** (MUST) — plan items become an interactive checklist with a live progress bar, persisted per session.
- **Guided Conversational Flow** (MUST) — proactively suggests the next logical step from the plan.
- **Context Memory** (MUST) — remembers the user's role and progress across the session.
- **"Who do I ask?"** (SHOULD) — matches a question to the right person from the Slack org chart; can draft an intro message.
- **HR Dashboard** (STRETCH) — completion %, most-asked questions, bottleneck topics.
- **Knowledge Gap Alert** (STRETCH) — logs unanswerable questions so HR knows which docs are missing.

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

---

## 🧱 Tech Stack

| Category | Choice |
| -------- | ------ |
| Framework | Next.js (App Router) — single full-stack app (UI + API routes) |
| Language | TypeScript across the whole project |
| Database | Supabase (Postgres + pgvector for embeddings) |
| Styling/UI | Tailwind CSS with semantic theme tokens (light/dark) |
| Auth | Supabase Auth (added later; not in the initial structure feature) |
| Deployment | Vercel (one deployment for UI + API) |

AI / RAG: Google **Gemini** as the LLM and embeddings provider, retrieval over Supabase **pgvector**. Integrations: GitHub App + Slack App (logic starts as placeholders under `src/lib/*`; early frontend work uses mock data under `src/data/mock`).

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

### MVP
- Plan generator (structured JSON output)
- RAG chat with cited sources over mock GitHub/Slack docs
- Progress checklist with persistence
- Guided conversational flow + session context memory

### Later
- "Who do I ask?" org-chart matching + intro-message drafting
- HR Dashboard (completion %, top questions, bottlenecks)
- Knowledge Gap Alert
- Replace mock data with real Slack/GitHub sync once integrations are wired

---

## 📌 Status

New project. Being scaffolded as a single Next.js full-stack app (see `context/features/project-structure.md`). Source tree lives under `src/` (`src/app`, `src/components`, `src/lib`, `src/types`, `src/data/mock`).
