# Current Feature: GitHub Repo Connection Flow (T-GH-1)

## Status

Complete - branch `feature/github-repo-connection` (off freshly synced
`development`). Task `T-GH-1` from `context/tasks.md` (finish Phase 3). Builds on
the GitHub App auth + member-discovery work from the DB-rewrite feature.
Verified end-to-end in the browser (connect/verify/disconnect cycle + error
path + responsive at 390); `tsc`/lint/build pass.

## Goals

Turn the project's GitHub connection from a static read-only string into a real,
verifiable product flow, admin-only, on the project overview Connections card:

1. **Connect / install** — from the Connections card, an admin can install the
   Onboardly GitHub App on the project's repo owner (reusing the existing
   `?state=projectId` install URL → `/api/github/callback` which persists
   `installation_id`).
2. **Verify access** — confirm the resolved installation can actually read the
   repo (installation token → `GET /repos/{owner}/{repo}`); on success set
   `ConnectionStatus = CONNECTED` + `connectedAt`, on failure surface a clear
   error and leave status `ERROR`/`DISCONNECTED`.
3. **Live status display** — replace the static repo string with live state:
   Connected (with repo + verified time), Not installed (with install action),
   or Error (with retry/reinstall). Slack stays read-only/TODO this slice.
4. **Disconnect** — an admin can disconnect, clearing the installation + status.

## Notes

Scope decided with the user: repo *selection* stays in create/edit; this slice
adds **verify + status + connect/disconnect actions on the overview card** (not a
separate connect dialog). All actions are ADMIN-gated via `requireProjectAdmin`
(Prisma bypasses RLS — enforce in app logic). Reuse existing helpers:
`getRepoInstallationId`, `installationAuthHeaders`, `getProjectInstallationId`
(self-healing), `saveProjectInstallationId`, `githubAppInstallUrl(projectId)`.
Writes go to the normalized `project_connections` row (`status`, `connectedAt`,
`installationId`). Must be fully responsive (390/768/1440) and token-themed.

## History

### Greenfield DB Rewrite — Complete

Done + merged to `development` + pushed (`ae24677`); branch deleted. Schema
normalized (drop orgs, `user_identities`, `project_connections`,
`documents→document_chunks→embeddings`, `message_citations`, `sync_jobs`),
members feature re-pointed, create-project GitHub repo picker, and the GitHub
member-discovery flow verified end-to-end in the browser. Also: missing
`/api/github/callback` route built, self-healing installation resolver, DB reset
to empty (`db:reset-data`) with a guarded seed, `Administration: Read` +
per-owner-install requirements documented, and the theme-init React 19 warning
fixed via `useServerInsertedHTML`. Full handoff:
`context/features/db-rewrite-handoff.md`; review: `context/features/db-rewrite-review.md`.

### DB Rewrite — Review, GitHub Discovery Fixes & Data Reset

Reviewed the externally-committed normalization baseline (`de2535c`) and the
create-project picker follow-up, then fixed the GitHub member-discovery flow and
reset the database to a clean empty state. The normalization itself was faithful
to the locked decisions; the "members don't show" bug was a config + stale-data
problem, not a schema bug.

- **Data reset (rows only, schema kept):** added `scripts/reset-data.ts`
  (`npm run db:reset-data`) that `TRUNCATE`s all 18 tables — clears the fixture
  junk (the placeholder `0000…000` owner / demo project the seed inserted when
  `SEED_USER_ID` was unset) without dropping tables. Decided to **keep all 18
  tables**: every empty one is referenced by already-written ingestion/course/
  chat/RAG code or a locked-plan feature (dropping would break the build);
  `app_roles` is the only code-unused table and is kept as the intended admin
  model. Hardened `prisma/seed.ts` to refuse running without a real
  `SEED_USER_ID` so it can't repopulate fixture junk. Supabase `auth.users` is
  untouched (different schema).
- **Missing GitHub App callback route (404):** built
  `src/app/api/github/callback/route.ts` — receives `installation_id` /
  `setup_action`, verifies the caller is a project ADMIN, and persists the
  installation id onto the project's GitHub connection. The install URL now
  round-trips `?state=<projectId>` (`githubAppInstallUrl(projectId)`). Distinct
  from Supabase OAuth login (`…supabase.co/auth/v1/callback`).
- **Self-healing installation resolver:** `getProjectInstallationId` now resolves
  the installation **live from the repo owner** (authoritative) instead of
  trusting a stored id; ignores stale/wrong ids (e.g. a personal install id
  saved for an org repo, which minted a token that 404'd on the collaborators
  API), self-heals the stored value, and returns null when the App isn't
  installed → UI shows the proper "install the app" state.
- **Root cause of empty modal (config, not code):** the App lacked
  **Administration: Read**, which the collaborators API requires (404 without
  it) — user added it; and the App was only installed on the personal `htuco`
  account, not on the orgs owning the projects' repos. Documented both in
  `.env.example`.
- **In-app guidance:** the Add Members dialog now shows a persistent "How GitHub
  discovery works" note (App must be installed on the repo's owner; only an
  owner can install; any project admin can then add; only collaborators with an
  Onboardly account are addable) plus clearer blocked-state copy + install link.
- **Theme-init React warning fixed:** moved the anti-flash script out of the
  layout's React tree into `ThemeProvider` via `useServerInsertedHTML`, removing
  the React 19 "script tag while rendering" console error.
- **Verified end-to-end in the browser** (logged-in admin): `htuco/htuco`
  members page lists the real collaborators (`htuco` self, `altmahrum-web`) with
  correct addable/already-member/self states; the `HarisS23/Flair` project (App
  not installed) shows the install prompt + guidance note. `next lint` + `tsc` +
  `next build` all pass.

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
