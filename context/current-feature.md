# Current Feature: Course Generation — Auto Repo, Embeddings Context & DB Persistence

## Status

In Progress

## Goals

- **Auto-fill GitHub repo** — when the user opens a project's course page, the GitHub repo field is pre-populated from `ProjectConnection.externalRef` (provider = GITHUB); no manual entry required.
- **Embeddings context in generation** — query the project's `DocumentChunk` rows and include their text in the Gemini prompt alongside the GitHub repo context, so the course draws on uploaded docs and synced content, not just the repo files.
- **DB persistence** — after course generation, save the full course to Prisma (`courses` → `modules` → `lessons` → `checklist_items` + `quizzes`). On subsequent visits, load from DB instead of re-generating. "Regenerate" clears the DB record and re-runs generation.

## Notes

- GitHub repo field: `ProjectConnection.externalRef` where `provider = GITHUB` on the project. Pass as `initialRepo` prop to `CoursePlayer`.
- Existing course: server component fetches the most recent `Course` for the project and passes it as `initialCourse` to `CoursePlayer`; if present, skip the generate form.
- Document chunks: query `DocumentChunk` rows via their `Document` → `projectId` relation; take up to ~30 chunks, cap at 20KB total. Prepend as "Project Documentation" block in the prompt before the GitHub context.
- DB save: after `generateCourse()` returns, call a `saveCourse()` helper that writes `Course` + nested `Module` + `Lesson` + `ChecklistItem` + `Quiz` rows via Prisma in a transaction.
- DB delete: "Regenerate" deletes the existing `Course` row (cascades to all children), then re-runs generation.
- localStorage is kept as an in-session cache (position + checklist + quiz answers) but the source of truth for course content moves to the DB.
- Branch: `feature/course-db-embeddings`

## History

### New-Hire Dashboard UI (Onboarding Overview) — Complete

Done + committed on branch `feature/dashboard-ui` (off `development`); pushed.
Not yet merged to `development`. Full spec: `context/features/dashboard-ui.md`.

Rebuilt `/dashboard` as the new-hire **onboarding overview** from the reference
design — reusable card components driven entirely by **mock data** (no DB reads
this slice). Tokens only (purple theme, light+dark), fully responsive.

- **Data layer (mock):** `src/types/dashboard.ts` (`StepStatus`, `FocusTask`,
  `OnboardingStep`, `UpcomingEvent`, `RecommendedRead`, `ActivityItem`,
  `DashboardData`) + `src/data/mock/dashboard.ts` (`mockDashboard`: Alex, 66%
  progress, today's focus, onboarding steps, upcoming, reads, sample question,
  recent activity).
- **Components (`src/components/dashboard/`):** `WelcomeBanner` (greeting +
  dual CTA + theme-swapped illustration + embedded `ProgressRing`),
  `ProgressRing` (pure-SVG ring), `DashboardCard` (shared wrapper), `status.tsx`
  (`StatusIcon` / `StatusLabel`), `TodaysFocusCard`, `OnboardingProgressCard`
  (timeline), `UpcomingCard`, `RecommendedReadsCard`, `AskOnboardlyCard`,
  `RecentActivityCard`, `ComingSoon`.
- **Page + routes:** `/dashboard` recomposed (mock data, `mx-auto max-w-6xl`,
  responsive grid); placeholder sub-routes `My Plan` / `Resources` /
  `AI Assistant` / `Settings` via `ComingSoon`.
- **Shell restructure:** `Sidebar` → primary nav (Overview / My Plan /
  Resources / AI Assistant / Settings) + Workspace (Projects / Integrations),
  active state via `usePathname`, real user chip (avatar/name + sign-out)
  pinned to the bottom; `AppShell` → `h-screen overflow-hidden` flex shell
  (fixes the bottom user chip falling below the fold) threading the Supabase
  identity to the sidebar; `AuthHeader` → logo + static search affordance +
  "Open today's tasks" CTA / theme toggle / bell, aligned to the card column.
- **Illustration:** two PNGs in `public/` (`onboarding-illustration-light.png`,
  `…-dark.png`), made transparent via flood-fill knockout, theme-swapped with
  `dark:hidden` / `hidden dark:block`. `next.config.ts` → `devIndicators:
  false`.
- **Responsive fix:** the progress ring's pull-in negative margin is gated to
  `sm:`+ (where the illustration is visible beside it) so the ring stays
  centered and never overlaps the illustration at narrow widths.
- **Verified:** `next lint` + `next build` pass (0 errors). Browser-confirmed by
  the user (banner alignment + ring/illustration spacing across widths, both
  themes). Note: the full automated 390/768/1440 sweep was done visually by the
  user, not via Playwright (browser session was locked).

### GitHub Repo Connection Flow (T-GH-1) — Complete

Done + merged to `development` + pushed (`1df0ff5`); branch deleted. The project
overview Connections card is now a live, admin-gated GitHub panel: Verify access
(installation token → `GET /repos/{owner}/{repo}` → `project_connections.status`
= CONNECTED + `connectedAt`, else ERROR/DISCONNECTED with a clear reason), live
status display, Install App (`?state=projectId`), and Disconnect. Reuses the
self-healing installation resolver and the `/api/github/callback` route. Verified
end-to-end in the browser (connect/verify/disconnect + error path + responsive at
390). Files: `src/lib/github/client.ts` (`verifyRepoAccess`),
`src/lib/projects/connection-actions.ts`,
`src/components/projects/GitHubConnectionCard.tsx`.

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

### Core Project Management (Phase 2)

Built the real project-management layer: an auto-provisioned organization per user plus full project CRUD backed by Prisma/Supabase, replacing the mock-data placeholders on the dashboard and projects pages.

### GitHub Login + Auto-Connect & List Repos (Phase 3 start)

Finished the "Continue with GitHub" login and used it to list the user's repositories, flagging which are ingestion-ready.

### Landing Page Redesign

Rebuilt the public landing page as a faithful, responsive reproduction of the reference design.

### Backend Foundation — Database (Prisma + Supabase) & Auth (Phase 1)

First "real backend" pass: Prisma data layer wired to Supabase Postgres, end-to-end Supabase authentication.

### Global Theming

Added a global light/dark theming system on top of shadcn/ui + Tailwind v4, Symphony-inspired blue palette.

### Initialize Project Structure

Scaffolded Onboardly as a single Next.js full-stack app in the `onboardly/` subfolder.
