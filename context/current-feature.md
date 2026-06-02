# Current Feature: Project Members & Admin

## Status

In Progress — branch `feature/project-members-and-admin` (off `development`). Deadline: tomorrow 17:00. Full spec: `context/features/project-members-and-admin.md` (+ companion `project-members-migration-plan.md`). Tasks: `T-MEM-1..4` (T-MEM-5 invite-flow deferred, T-MEM-6 lands with Course UI).

## Goals

**Project Members & Admin** — let a project **admin** (creator/lead) add other Onboardly developers to a project, discovered from the project's connected **GitHub repo collaborators**, and give those developers a real **member** experience (see the project, open course + chat, view the roster). Admin keeps full project CRUD; members are read-only on project settings.

Buildable scope for this slice (confirmed with user):

1. **Members CRUD + roster** — `ProjectMember` model, project roles (`ADMIN` | `MEMBER`), add/remove, admin roster UI, server-side role enforcement.
2. **GitHub discovery import** — list repo **collaborators** (`GET /repos/{owner}/{repo}/collaborators`, installation token) and intersect with Onboardly users to build the "Add members" candidate list.
3. **Member's cross-org project view** — a developer added to a project in *another* org can see + open that one project.
4. **Onboarding % (stub-safe)** — `LessonProgress` table + derived % now; renders "Not started" until the course system (Phases 8–10) exists. No stored percent.

## Notes

Decisions locked with the user (these **supersede** the older email/contributors/invite design that the spec file previously held):

- **Discovery = repo collaborators API**, not contributors — so a brand-new hire with 0 commits still appears (they have repo *access*).
- **Identity link = GitHub login (lowercased), email fallback.** GitHub returns `login` only for collaborators, so login is the join key.
- **Members must already have an Onboardly account** (with GitHub connected). No invite/pre-signup limbo this slice. Collaborators without an account show **greyed-out "No Onboardly account."**
- **New `UserProfile` table** maps Supabase `userId` → `githubLogin` (+ email/avatar/name), populated on GitHub login from `user_metadata`. Discovery = repo collaborators ∩ `UserProfile`.
- **Biggest behavioral change — cross-org visibility:** `listProjects` becomes the **union of owned ∪ member-of**; `getProject` is superseded by `getProjectAccess(projectId)` → `{ project, role } | null`. Every existing `getProject` call site (overview/edit/course/chat/admin/update/delete) must be routed through the right guard. Membership grants access to **that one project only**, never the whole foreign org.
- **Permissions (enforced server-side, Prisma bypasses RLS):** Admin = edit/delete/connect/add-remove/see-all-progress. Member = see overview + course + chat + read-only roster; cannot edit/delete/connect/add. Don't lock out the last admin.

Migration/backfill: existing projects get their org owner back-filled as an `ADMIN` member; existing users get a `UserProfile` on their next GitHub login (acceptable for demo).

**Member Remove = soft-delete** (decided): set `status: REMOVED`, keep the row + `LessonProgress`, filter `status != REMOVED` everywhere (roster, access check, candidate "already added"). Re-adding reactivates the existing row (`@@unique([projectId, userId])` → upsert, not insert) so prior progress is restored.

Workflow next steps: branch off `development` (`/feature start`), implement `T-MEM-1` → `T-MEM-4`, lint+build, browser-test the acceptance checklist in the spec, then commit in small logical chunks.

## History

### Core Project Management (Phase 2)

Built the real project-management layer: an auto-provisioned organization per user plus full project CRUD backed by Prisma/Supabase, replacing the mock-data placeholders on the dashboard and projects pages. This is the prerequisite for the Phase-3 GitHub repo-connection flow (the `integrations` table FKs to a real `projects` row — the DB had 0 orgs / 0 projects before this).

- **Org auto-create (minimal):** `getCurrentOrganization()` returns the user's org or creates one on first use (owner = Supabase auth user id), so projects always have a tenant. No org-management UI this slice. (`src/lib/projects/queries.ts`.)
- **Project CRUD:** `createProject` / `updateProject` / `deleteProject` server actions (`src/lib/projects/actions.ts`) + scoped reads `listProjects` / `getProject` (`queries.ts`). Fields: Name, Description, GitHub repo, Slack workspace, Status (`DRAFT | SYNCING | READY | ERROR`). Inputs validated; optional text fields normalize empty → null; status validated against the Prisma enum.
- **Tenant isolation in app logic:** every read/write is scoped to the current user's org (Prisma bypasses RLS). `getProject` doubles as the isolation guard before update/delete; detail/edit pages `notFound()` on a foreign or missing id.
- **UI:** `/projects` (real list + "New project"), `/projects/new` (create), `/projects/[projectId]` (details: name/description/status, GitHub/Slack connections, Edit/Delete), `/projects/[projectId]/edit` (prefilled). Dashboard now lists real projects. Shared `ProjectForm` (create+edit via `useActionState`), `DeleteProjectButton` (confirm), `ProjectStatusBadge`. Added shadcn `textarea` + `label` primitives. All `force-dynamic`, behind the existing `(auth)` guard.
- **Type reconciliation:** `src/types/project.ts` `Project` aligned to the Prisma model (`status: ProjectStatus`, nullable `description`); mock data updated. Client components import the `ProjectStatus` enum from `@/generated/prisma/enums` (not the full client) to keep it out of the client bundle.
- **Verified:** `next lint` + `next build` pass (0 errors). Data layer exercised directly against real Supabase: org auto-create is idempotent, create/list/update/delete work, and **tenant isolation holds** (a second org is blocked from reading/updating/deleting another org's project). Dev server boots clean; unauthenticated `/projects` → `/login` redirect confirmed. **Note:** the authenticated browser click-through (create→view→edit→delete in the UI) was not run — needs login creds. **Also in this branch (separate work):** purple theme refresh in `globals.css` + app icon (`icon1/2.png`, `AppIcon`), and session docs — a team task board (`context/tasks.md`), a members/admin design spec (`context/features/project-members-and-admin.md`), and a new **responsive-by-default** standard in `coding-standards.md` / `ai-interaction.md`.

### GitHub Login + Auto-Connect & List Repos (Phase 3 start)

Finished the "Continue with GitHub" login and used it to list the user's repositories, flagging which are ingestion-ready. Resolved the two-GitHub-identities question with the **"Both"** approach: the OAuth `provider_token` powers the immediate full-repo listing, while the GitHub App installation is detected and surfaced as an "ingestion-ready" flag (App installation stays the Phase-3 ingestion path).

- **OAuth scopes + token capture:** `signInWithGitHub` now requests `read:user repo read:org`. The user-scoped `provider_token` is only available right after `exchangeCodeForSession`, so `/auth/callback` captures it into a short-lived **httpOnly cookie** (`gh_provider_token`, ~1h, `secure` in prod, `sameSite=lax`); `signOut` clears it. (`src/lib/auth/actions.ts`, `src/app/auth/callback/route.ts`.)
- **Repo listing helper (`src/lib/github/oauth.ts`):** `listUserRepos(token)` paginates `GET /user/repos` (owner + collaborator + org, sorted by recently-updated) and, in parallel, walks `GET /user/installations` → `/repositories` to build the set of App-installed repos. Each repo is mapped to a typed `GitHubRepo` with an `ingestionReady` flag. Installation lookup failures are non-fatal (listing still renders). Kept separate from the App-token helper in `client.ts`.
- **Repos page (`/integrations/github`):** server component reads the cookie and renders the list with Private/Public + **Ingestion-ready** badges, description, language, and a per-repo **Install app** deep-link (`github.com/apps/<slug>/installations/new`). Graceful states for no-token (email user / expired) and fetch errors, both offering a reconnect path. `force-dynamic`; covered by the existing `/integrations` middleware guard.
- **Integrations card:** the GitHub card now reflects live Connected/Not-connected state from the cookie and links to the repos page (or to GitHub login when not connected).
- **App slug:** resolved the GitHub App's public slug (`onboardly-code-analyzer`) by querying `GET /app` with the App JWT; set `NEXT_PUBLIC_GITHUB_APP_SLUG` in `.env.local` and documented it (+ the OAuth-App/Supabase-provider setup and login scopes) in `.env.example`.
- **External setup (done by user):** created the GitHub **OAuth App** (callback `https://nirczzsfcqknmtwdufib.supabase.co/auth/v1/callback`) and enabled the Supabase GitHub provider with its client id/secret — distinct from the GitHub App.
- **Verified:** `next lint` + `next build` pass (0 errors). Full flow browser-tested via Playwright against real Supabase + GitHub: GitHub login → 2FA → callback → `/dashboard`; Integrations shows **Connected**; `/integrations/github` listed **43 real repos** with correct privacy/language badges and install links. No repos showed "Ingestion-ready" (expected — the App isn't installed on any yet). **Note:** `provider_token` is short-lived with no refresh, so listing falls back to a reconnect prompt after ~1h; switching listing to the App installation token would make it persistent (future).

### Landing Page Redesign

Rebuilt the public landing page (`src/app/(public)/page.tsx`) as a faithful, responsive reproduction of the reference design in `context/features/screenshots/image.png` — a split hero (messaging left, product-preview cards right) on the existing shadcn/ui + Tailwind v4 token layer, in the Symphony blue palette. Spec evolved mid-build: an initial "remove badge / remove stats / no-scroll" brief was reversed to "make it identical to the screenshot + responsive," then refined with detailed decoration feedback.

- **Header (`PublicHeader.tsx`):** added a logo icon mark, nav links (Features / How it works / Reviews), `Log in` + primary `Start Onboarding`, centered in a `max-w-6xl` container; theme toggle kept.
- **Left column:** blue "✦ AI onboarding assistant" badge, headline "Help every new hire **start strong.**" (last words in `text-primary`), subcopy, dual CTA (`Start Onboarding` / `How it works`), and a feature-pill row (Personalized plans · Company knowledge · Guided first steps).
- **Right column:** three overlapping, slightly-rotated (`lg:`-only) preview cards — "Your onboarding plan" (flag icon, blue check circles, task list), "Welcome aboard, Alex!" (👋 + skeleton lines), and "Ask Onboardly" (sparkle, PTO-policy question, document icon + skeleton lines).
- **Background decoration:** dot-grid cluster with a soft glow (blurred + crisp layers, radial-mask fade) in the top-left negative space, concentric primary-tinted arcs sweeping in from the right, and a soft primary glow — clipped to a rounded panel (`overflow-hidden`) so nothing bleeds past the edge; cards inset via `lg:p-8` so the decoration shows around them.
- **Stats strip:** 5,000+ Teams onboarded · 4.9/5 Average rating · 60% Faster ramp time · 99% New hire satisfaction (each with a lucide icon).
- **Responsive:** single-column centered stack on mobile/tablet (rotation + decoration gated to `lg`), two-column split on large screens; verified at 390 / 768 / 1440.
- **Tokens only:** no hardcoded colors; renders correctly in light and dark.
- **Verified:** `next lint` + `next build` pass (0 errors, 0 warnings); browser-tested both themes via Playwright at multiple widths. Note: a stale pre-theme dev server initially served monochrome CSS — restarted clean to verify the real blue palette. (Merge note: the `/login` routing from the Backend Foundation work was kept on the header CTAs.)

### Backend Foundation — Database (Prisma + Supabase) & Auth (Phase 1)

First "real backend" pass after the UI/theming work: a working Prisma data layer wired to Supabase Postgres, and end-to-end Supabase authentication. The GitHub App for codebase analysis was created and its credentials wired/verified (the actual repo install + sync UI is deferred to Phase 3).

- **Data-layer split (decided):** Prisma owns schema + migrations + typed CRUD (connects as `postgres`, **bypasses RLS** → tenant isolation enforced in app logic); Supabase keeps **Auth**, **Storage**, and **pgvector**. Vector similarity search will use raw SQL (`<=>`), not the Prisma query builder.
- **Prisma 7 setup:** `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`. Used the v7 conventions — `prisma-client` generator → `src/generated/prisma` (git-ignored), connection URLs in `prisma.config.ts` (not `schema.prisma`), `postgresqlExtensions` preview. The config's `datasource.url` = `DIRECT_URL` (session pooler, port 5432, for migrate); runtime uses the pg driver adapter with the pooled `DATABASE_URL` (port 6543, `?pgbouncer=true`).
- **Schema (`prisma/schema.prisma`):** all 12 tables — `organizations`, `projects`, `documents`, `embeddings`, `courses`, `modules`, `lessons`, `checklist_items`, `quizzes`, `chats`, `chat_messages`, `integrations` — with enums, cascade FKs, `@@map` snake_case, and `embeddings.embedding` as `Unsupported("vector(768)")` (Gemini embed dims). Declared `vector` + the default Supabase extensions to avoid migrate drift.
- **Applied via `prisma db push`** (no migration history yet — hackathon-friendly first sync). Verified live on Supabase: 12 tables present, **pgvector enabled**.
- **Prisma client singleton (`src/lib/db/prisma.ts`):** pg driver adapter + dev hot-reload global guard.
- **Auth (Phase 1):** Next 16 **`proxy.ts`** (renamed from `middleware.ts`) refreshes the Supabase session on every request and guards `/dashboard`, `/projects`, `/integrations` (redirect to `/login?redirectTo=…`); `(auth)/layout.tsx` adds a server-side `getUser()` guard. `/login` (server) renders a client `LoginForm` — GitHub OAuth + email/password sign-in & sign-up via server actions (`src/lib/auth/actions.ts`, `useActionState` for inline errors). `/auth/callback` exchanges the OAuth code for a session. `AuthHeader` now reads the real user and renders `UserMenu` (email + avatar + sign-out). Landing/`PublicHeader` CTAs point to `/login`.
- **GitHub App (Phase-3 prep):** "Onboardly Code Analyzer" created (read-only Metadata/Contents/PRs/Issues). `src/lib/github/client.ts` upgraded from placeholder to a real App-auth helper: `createAppJwt` (RS256 via `node:crypto`) → `getInstallationToken` → `installationAuthHeaders`. Env wired (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` as single-line `\n`-escaped PEM, client id/secret). **Verified** by signing a JWT and hitting `GET /app` — GitHub authenticated it with the expected permissions. Repo install flow + sync UI intentionally deferred to Phase 3.
- **Config:** `.env.example` documents the two Prisma URLs; `.gitignore` ignores `/src/generated`; `eslint.config.mjs` ignores `src/generated/**`; added `db:generate` / `db:migrate` / `db:push` / `db:studio` scripts. `lucide-react` dropped its GitHub brand glyph, so the login button inlines the official mark.
- **Verified:** `next lint` + `next build` pass (0 errors). Full auth flow browser-tested via Playwright against real Supabase: unauthenticated `/dashboard` → redirect to login; email sign-up creates a user (confirmation message shown); after admin email-confirm, sign-in lands on `/dashboard` with the user's email in the header; sign-out clears the session and re-protects routes. Supabase anon + service-role keys and the Gemini key are in git-ignored `.env.local` (never committed). **Note:** the GitHub "Continue with GitHub" button needs the Supabase GitHub provider configured (OAuth app + provider enable) before it works — email/password works today.

### Global Theming

Added a global light/dark theming system on top of the existing **shadcn/ui + Tailwind v4** token layer, using a Symphony-inspired blue enterprise palette. The spec was written for a Vite/React layout (`App.tsx`, `Welcome.tsx`, `tailwind.config.js`); it was translated onto our Next.js App Router stack — re-tinting the existing shadcn semantic tokens rather than introducing a parallel `--color-*` system or a Tailwind config file.

- **Tokens (`globals.css`):** re-tinted `--background`, `--foreground`, `--primary`, `--card`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, charts, and sidebar tokens for both `:root` (cool white) and `.dark` (deep navy), all in oklch. Added `--success`, `--warning`, `--border-strong` and registered them in `@theme inline`.
- **Theme lib (`lib/theme.ts`):** read/resolve/apply/persist helpers + an inline `THEME_INIT_SCRIPT` that sets the `.dark` class pre-hydration to avoid theme flash; defaults to system preference when no stored choice.
- **Provider/toggle (`components/theme/`):** `ThemeProvider` (context, lazy init, persists to `localStorage`) and `ThemeToggle` (lucide Sun/Moon, `useSyncExternalStore` for hydration-safe mount, generic label until hydrated).
- **Integration:** root `layout.tsx` runs the init script in `<head>` and wraps the app in `ThemeProvider`; toggle added to `PublicHeader` (now sticky/translucent) and `AuthHeader`.
- **Landing page:** rebuilt around tokens — badge, hero, dual CTA (`Start Onboarding` / `How it works`), three preview cards. No hardcoded colors remain in the UI.
- **Verified:** lint + build pass; browser-tested both themes via Playwright — light/dark render correctly, toggle round-trips, choice persists across reload with no flash, and a hydration-mismatch on the toggle's `aria-label`/`title` was found and fixed. Added `.playwright-mcp/` to `.gitignore`.

### Initialize Project Structure

Scaffolded Onboardly as a single **Next.js (App Router) full-stack app** in the `onboardly/` subfolder — TypeScript, Tailwind v4, shadcn/ui (radix-nova), ESLint + Prettier. Also pivoted all project context to the new stack (Next.js + Supabase + Gemini, away from the old FastAPI + Vite + FAISS plan) and captured the full 13-phase build plan in `context/roadmap.md`.

- **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Supabase (`@supabase/ssr`) · Gemini (`@google/genai`).
- **App tree (`onboardly/src`):** `(public)` landing + `(auth)` dashboard/projects/`[projectId]`(overview, course, chat, admin)/integrations behind an `AppShell`; 7 placeholder API routes; lib placeholders (supabase, ai/gemini, github, slack, documents, rag, course); shared types; mock data.
- **Layout:** app lives in `onboardly/`; repo root holds project meta + top-level `README.md`.
- **Context updates:** CLAUDE.md, project-overview.md, coding-standards.md, README.md, ai-interaction.md updated to the new stack; `context/roadmap.md` added.
- **Verified:** `eslint` and `next build` pass with no real credentials; all routes render (pages 200, API routes return placeholder JSON). Fixed a `setAll` implicit-any in the Supabase server client and removed a deprecated `baseUrl` from tsconfig.
