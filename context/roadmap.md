# Onboardly Roadmap (Authoritative)

> Full phased build plan for the AI Developer Onboarding Platform. This is the canonical roadmap; `project-overview.md` summarizes it and links here.

## Project Goal

Build an internal onboarding platform that:

- Connects to GitHub repositories
- Connects to Slack workspaces
- Accepts uploaded documentation
- Builds a project knowledge base
- Generates personalized onboarding courses based on a user's role
- Generates checklists and quizzes
- Provides a chat interface backed by project knowledge
- Provides citations to source material
- Helps identify relevant people and communication channels

---

## Tech Stack

**Frontend / Backend (one Next.js app)**
- Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui

**Database**
- Supabase Postgres · pgvector · Supabase Auth · Supabase Storage

**AI**
- Gemini 2.5 (LLM) · Gemini Embeddings

**Integrations**
- GitHub App · Slack App

**Tooling**
- ESLint · Prettier

---

## Ingestion Architecture (decide early — affects everything downstream)

```
GitHub Sync ─┐
Docs Sync  ──┼─→ Ingestion Queue ─→ Knowledge Builder ─→ Embeddings
Slack Sync ──┘                                          Knowledge Graph
                                                        Course Generation
```

---

## Phases

### Phase 1 — Project Setup
- Repo: Next.js, Tailwind, shadcn/ui, ESLint, Prettier
- Supabase project: env vars, connect Next.js to Supabase
- Auth: GitHub login, Email login, protected routes
- Database schema (tables): `organizations`, `projects`, `documents`, `embeddings`, `courses`, `modules`, `lessons`, `checklist_items`, `quizzes`, `chats`, `chat_messages`, `integrations`

### Phase 2 — Core Project Management
- Organization CRUD
- Project CRUD — fields: Name, Description, GitHub repo, Slack workspace, Status

### Phase 3 — GitHub Integration (parallel with Phase 4)
- GitHub App (permissions: Metadata R, Contents R, Pull Requests R, Issues R)
- Repository connection flow: connect, save installation info, verify access
- Repo sync: fetch metadata / folder structure / files; ignore `node_modules`, `build`, `dist`, `coverage`, generated files
- Repo analysis: Repository Map, Folder Summaries, Architecture Summary, Knowledge Graph (nodes: systems, features, APIs, services, databases, ownership)

### Phase 4 — Documentation Upload (parallel with Phase 3)
- Supabase Storage setup
- Upload support: PDF, Markdown, DOCX, TXT
- Parsing: extract raw text; store original file + parsed content
- Chunking: split documents into chunks, store chunks

### Phase 5 — Slack Integration (after basic GitHub)
- Slack App (scopes: `channels:read`, `channels:history`, `groups:read`, `groups:history`, `users:read`)
- Workspace connection: OAuth flow, save workspace info
- Slack sync: channels, messages, threads
- Slack processing: topic summaries, feature discussions, team ownership hints; store summaries

### Phase 6 — Embeddings & Search (requires GitHub + Docs ingestion)
- Embedding pipeline: per chunk → generate embedding → store in pgvector
- Sources: documentation, repo summaries, architecture summaries, Slack summaries
- Retrieval layer: similarity search (input: question → output: most relevant chunks)

### Phase 7 — Knowledge Base (requires GitHub + Docs + Embeddings)
- Unified knowledge model: Systems, Components (frontend/backend/db/infra), Relationships (e.g. Auth → API → Database)
- Citation system: track source for every chunk (file path, document, Slack channel)

### Phase 8 — Course Generator (requires Knowledge Base)
- Role input: free-text role descriptions (Frontend/Backend/DevOps Engineer, etc.)
- Generation: modules, lessons, checklists, quiz questions, estimated duration
- Structure: Course → Modules → Lessons → Checklist → Quiz
- Editable content: admins edit lessons, reorder modules, add/remove content

### Phase 9 — Course UI (Anthropic Academy style)
- Sidebar: modules + progress
- Lesson page: content, checklist, quiz
- Progress tracking: completed lessons / modules / quiz completion

### Phase 10 — Chat Assistant (requires Embeddings + Knowledge Base)
- Chat page: user asks a question
- RAG pipeline: question → retrieve chunks → build context → send to Gemini → generate answer
- Citations: file, documentation source, Slack source

### Phase 11 — Ownership Detection (requires GitHub + Slack)
- Ownership engine: analyze commit history, PRs, discussions → determine feature owners + most active contributors
- Contact suggestions (e.g. "Authentication is primarily maintained by Alice, Bob")

### Phase 12 — AI Message Generation (requires Ownership Detection)
- Generate a professional intro/question message (e.g. "I'm onboarding and have a question about JWT refresh logic.")
- Include citations: files, documentation, Slack discussions

### Phase 13 — Admin Dashboard
- Knowledge base status: GitHub sync, Slack sync, embedding, course generation
- Controls: Resync GitHub, Resync Slack, Regenerate Course, Rebuild Knowledge Base

---

## Gemini Integration Tasks
- API key from Google AI Studio; env var `GEMINI_API_KEY`
- Services: Embedding (text → vector), Course Generator (role + knowledge → course), Quiz Generator (lesson → quiz), Chat (question + retrieved context → answer)

## Supabase Integration Tasks
- Enable: Auth, Storage, pgvector
- Buckets: `docs`, `uploads`
- RLS: organizations can only access their own projects
- DB functions: vector search, course retrieval, progress tracking

---

## Final MVP Flow

1. Admin creates project
2. Connect GitHub repository
3. Connect Slack workspace
4. Upload documentation
5. Generate knowledge base
6. User enters role
7. AI generates onboarding course
8. User completes lessons
9. User asks questions through chat
10. AI answers with citations
11. AI suggests relevant contacts when needed
