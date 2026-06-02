# Initialize Project Structure Spec

## Overview

Set up the initial full-stack project structure for Onboardly as a Next.js application with Supabase, Gemini AI, and future-ready integrations for GitHub, Slack, uploaded documents, RAG chat, and AI-generated onboarding courses. The goal is to create a clean, scalable foundation that allows the team to build the MVP quickly without splitting frontend and backend into separate deployments.

## Requirements

* Initialize the project as a Next.js full-stack app.
* Use TypeScript across the whole project.
* Use the App Router structure.
* Use Tailwind CSS for styling.
* Prepare the app for global light/dark theming through semantic theme tokens.
* Set up a clear folder structure for:

  * public landing pages
  * authenticated app pages
  * API routes
  * shared UI components
  * Supabase client/server utilities
  * Gemini AI utilities
  * GitHub integration logic
  * Slack integration logic
  * document ingestion logic
  * RAG/search logic
  * course generation logic
  * shared types
  * mock data
* Create the initial route groups for public and authenticated areas.
* Create a minimal landing page route.
* Create placeholder authenticated routes for dashboard, projects, courses, chat, admin, and integrations.
* Create placeholder API route files for the main backend workflows.
* Add Supabase client setup for browser and server usage.
* Add Gemini client setup through a reusable utility file.
* Add basic environment variable documentation.
* Add `.env.example` with all required keys.
* Add placeholder mock data for demo development before real integrations are implemented.
* Keep the structure hackathon-friendly: simple enough to build fast, but organized enough to support future features.
* Do not implement full GitHub, Slack, RAG, or course generation logic in this feature; only prepare the project structure and placeholders.
* Avoid overengineering or creating unnecessary abstractions.
* Every created placeholder file should include a short comment explaining its purpose.

## Files to Create

* `src/app/(public)/page.tsx` — Public landing/welcome page for Onboardly.
* `src/app/(auth)/dashboard/page.tsx` — Main authenticated dashboard placeholder showing projects.
* `src/app/(auth)/projects/page.tsx` — Projects list placeholder.
* `src/app/(auth)/projects/[projectId]/page.tsx` — Project overview placeholder with knowledge base status.
* `src/app/(auth)/projects/[projectId]/course/page.tsx` — Generated onboarding course placeholder.
* `src/app/(auth)/projects/[projectId]/chat/page.tsx` — RAG chat placeholder.
* `src/app/(auth)/projects/[projectId]/admin/page.tsx` — Admin/project management placeholder.
* `src/app/(auth)/integrations/page.tsx` — Integrations overview placeholder.
* `src/app/api/projects/route.ts` — Placeholder API route for project CRUD.
* `src/app/api/github/sync/route.ts` — Placeholder API route for future GitHub repo sync.
* `src/app/api/slack/sync/route.ts` — Placeholder API route for future Slack sync.
* `src/app/api/documents/upload/route.ts` — Placeholder API route for uploaded document handling.
* `src/app/api/knowledge/generate/route.ts` — Placeholder API route for generating the knowledge base.
* `src/app/api/chat/route.ts` — Placeholder API route for future RAG chat.
* `src/app/api/course/generate/route.ts` — Placeholder API route for AI course generation.
* `src/components/layout/AppShell.tsx` — Shared authenticated app layout shell.
* `src/components/layout/PublicHeader.tsx` — Simple public landing page header.
* `src/components/layout/AuthHeader.tsx` — Header for authenticated pages.
* `src/components/layout/Sidebar.tsx` — Sidebar for authenticated app navigation.
* `src/components/ui/Button.tsx` — Shared button component using theme tokens.
* `src/components/ui/Card.tsx` — Shared card/surface component using theme tokens.
* `src/components/ui/Badge.tsx` — Shared badge component.
* `src/components/ui/Input.tsx` — Shared input component.
* `src/components/ui/EmptyState.tsx` — Reusable empty state component.
* `src/lib/supabase/client.ts` — Supabase browser client.
* `src/lib/supabase/server.ts` — Supabase server client helper.
* `src/lib/ai/gemini.ts` — Gemini client initialization and shared helper.
* `src/lib/github/client.ts` — Placeholder GitHub client helper.
* `src/lib/github/sync.ts` — Placeholder GitHub sync pipeline.
* `src/lib/slack/client.ts` — Placeholder Slack client helper.
* `src/lib/slack/sync.ts` — Placeholder Slack sync pipeline.
* `src/lib/documents/ingest.ts` — Placeholder document ingestion helper.
* `src/lib/rag/chunk.ts` — Placeholder text chunking helper.
* `src/lib/rag/embeddings.ts` — Placeholder embedding generation helper.
* `src/lib/rag/search.ts` — Placeholder vector search helper.
* `src/lib/course/generate.ts` — Placeholder course generation helper.
* `src/lib/course/schema.ts` — Course/module/lesson/checklist/quiz schema definitions.
* `src/types/database.ts` — Shared database-related TypeScript types.
* `src/types/project.ts` — Project and organization types.
* `src/types/course.ts` — Course, module, lesson, checklist, and quiz types.
* `src/types/chat.ts` — Chat and chat message types.
* `src/types/integrations.ts` — GitHub and Slack integration types.
* `src/data/mock/projects.ts` — Mock projects for early frontend development.
* `src/data/mock/course.ts` — Mock generated course data.
* `src/data/mock/chat.ts` — Mock chat messages.
* `src/data/mock/knowledge.ts` — Mock knowledge base documents/chunks.
* `.env.example` — Example environment variables for Supabase, Gemini, GitHub, and Slack.
* `README.md` — Update project setup instructions if missing or incomplete.

## Suggested Folder Structure

```txt
src/
  app/
    (public)/
      page.tsx
    (auth)/
      dashboard/
        page.tsx
      projects/
        page.tsx
        [projectId]/
          page.tsx
          course/
            page.tsx
          chat/
            page.tsx
          admin/
            page.tsx
      integrations/
        page.tsx
    api/
      projects/
        route.ts
      github/
        sync/
          route.ts
      slack/
        sync/
          route.ts
      documents/
        upload/
          route.ts
      knowledge/
        generate/
          route.ts
      chat/
        route.ts
      course/
        generate/
          route.ts

  components/
    layout/
      AppShell.tsx
      PublicHeader.tsx
      AuthHeader.tsx
      Sidebar.tsx
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      EmptyState.tsx

  lib/
    supabase/
      client.ts
      server.ts
    ai/
      gemini.ts
    github/
      client.ts
      sync.ts
    slack/
      client.ts
      sync.ts
    documents/
      ingest.ts
    rag/
      chunk.ts
      embeddings.ts
      search.ts
    course/
      generate.ts
      schema.ts

  types/
    database.ts
    project.ts
    course.ts
    chat.ts
    integrations.ts

  data/
    mock/
      projects.ts
      course.ts
      chat.ts
      knowledge.ts
```

## Route Structure

### Public Routes

* `/` — Landing/welcome page.
* Future public routes can include `/login`, `/pricing`, or `/about` if needed.

### Authenticated Routes

* `/dashboard` — Main dashboard with project list.
* `/projects` — All projects.
* `/projects/[projectId]` — Project overview and knowledge base status.
* `/projects/[projectId]/course` — AI-generated onboarding course.
* `/projects/[projectId]/chat` — Ask questions about the project knowledge base.
* `/projects/[projectId]/admin` — Manage docs, regenerate course, manage integrations.
* `/integrations` — GitHub and Slack integration overview.

## API Route Placeholders

### `POST /api/projects`

Create or list projects.

Initial placeholder response:

```json
{
  "message": "Project API placeholder"
}
```

### `POST /api/github/sync`

Future GitHub repository sync endpoint.

Expected future responsibility:

```txt
Fetch repo tree
Filter relevant files
Generate repo map
Summarize folders
Store documents and summaries
```

### `POST /api/slack/sync`

Future Slack workspace sync endpoint.

Expected future responsibility:

```txt
Fetch channels
Fetch messages and threads
Summarize discussions
Store Slack knowledge summaries
```

### `POST /api/documents/upload`

Future manual document upload endpoint.

Expected future responsibility:

```txt
Upload docs
Extract text
Store document content
Prepare for embeddings
```

### `POST /api/knowledge/generate`

Future knowledge base generation endpoint.

Expected future responsibility:

```txt
Chunk documents
Generate embeddings
Store vectors in Supabase pgvector
Generate project knowledge graph
```

### `POST /api/chat`

Future RAG chat endpoint.

Expected future responsibility:

```txt
Receive user question
Retrieve relevant chunks
Send context + question to Gemini
Return answer with citations
```

### `POST /api/course/generate`

Future AI course generation endpoint.

Expected future responsibility:

```txt
Receive role/project input
Use knowledge base + project graph
Generate modules, lessons, checklist, and quizzes
Store generated course
```

## Environment Variables

Create `.env.example` with:

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

## Initial Mock Data

Create mock data so frontend screens can be built before real backend logic exists.

### Mock Project

```ts
export const mockProjects = [
  {
    id: "project-1",
    name: "Onboardly Demo Project",
    description: "Demo project for AI onboarding assistant.",
    githubRepo: "heap/onboardly",
    slackWorkspace: "Heap Team",
    knowledgeStatus: "ready",
    createdAt: "2026-06-02T09:00:00Z",
  },
];
```

### Mock Course

```ts
export const mockCourse = {
  id: "course-1",
  roleName: "Frontend Engineer",
  modules: [
    {
      id: "module-1",
      title: "Project Overview",
      description: "Understand what the product does and how the team works.",
      lessons: [
        {
          id: "lesson-1",
          title: "Welcome to the project",
          content: "This lesson introduces the product, team structure, and first steps.",
          checklist: [
            "Read the project README",
            "Join the frontend Slack channel",
            "Set up the local development environment",
          ],
        },
      ],
    },
  ],
};
```

### Mock Chat

```ts
export const mockChatMessages = [
  {
    id: "msg-1",
    role: "assistant",
    content: "Hi! Ask me anything about your onboarding plan or project knowledge base.",
  },
];
```

## Key Gotchas

* Keep this feature focused on structure only; do not implement full RAG, GitHub sync, Slack sync, or course generation yet.
* Avoid building the project as separate frontend and backend apps. The MVP should remain one Next.js codebase.
* Do not add Python services for the initial MVP.
* Do not commit real API keys.
* Do not create database migrations in this feature unless explicitly requested separately.
* Keep API routes simple placeholders with correct structure and expected future responsibility comments.
* Make sure all folders are named consistently and are easy to understand.
* Use route groups carefully:

  * `(public)` for public pages
  * `(auth)` for authenticated app pages
* Avoid putting business logic directly inside page components.
* Keep reusable logic under `src/lib`.
* Keep reusable UI under `src/components`.
* Keep shared TypeScript types under `src/types`.
* Keep mock data separate from production logic under `src/data/mock`.
* Ensure all placeholder pages compile and render without external services configured.

## Testing

* Run `npm install`.
* Run `npm run dev`.
* Open `/` and verify the public landing page loads.
* Open `/dashboard` and verify the dashboard placeholder loads.
* Open `/projects` and verify the projects placeholder loads.
* Open `/projects/project-1` and verify the project placeholder loads.
* Open `/projects/project-1/course` and verify the course placeholder loads.
* Open `/projects/project-1/chat` and verify the chat placeholder loads.
* Open `/projects/project-1/admin` and verify the admin placeholder loads.
* Open `/integrations` and verify the integrations placeholder loads.
* Call each placeholder API route and verify it returns a simple JSON response.
* Run `npm run lint`.
* Run `npm run build`.
* Confirm the project builds successfully without requiring real Supabase, Gemini, GitHub, or Slack credentials.

## References

* Architecture direction: Next.js + Supabase + Gemini + GitHub App + Slack App.
* MVP goal: one codebase, one deployment, simple project structure, fast hackathon delivery.
* Future core flows:

  * Admin creates project.
  * Admin connects GitHub repo.
  * Admin connects Slack workspace.
  * Admin uploads docs.
  * System generates knowledge base.
  * New employee selects role.
  * AI generates course, modules, lessons, checklist, and quiz.
  * Employee asks questions in chat using RAG over project knowledge.
