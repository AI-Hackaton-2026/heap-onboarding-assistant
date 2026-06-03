# Feature: New-Hire Dashboard UI (Onboarding Overview)

> Build the new-hire **onboarding overview** dashboard from the reference design
> (light + dark), as reusable card components driven by **placeholder/mock
> data**. Task area: Course/Members UI surfaces (Phases 9/13-adjacent); this is
> the home surface a new hire lands on after login.

- **Branch:** `feature/dashboard-ui` (off `development`).
- **Status:** In Progress.
- **Reference:** the provided design screenshots (Onboardly dashboard, light +
  dark) — split sidebar + main grid of cards with a welcome banner and progress
  ring.

## Locked Decisions (with the user)

1. **Placement — replace `/dashboard`.** The onboarding overview becomes the new
   `/dashboard`. The existing project-list content that lived on `/dashboard`
   moves to `/projects` (which already renders the accessible-projects grid), so
   nothing is lost. `/dashboard` is the new-hire home.
2. **Sidebar — match the reference labels.** Restructure the sidebar nav to:
   **Overview** (`/dashboard`), **My Plan** (`/dashboard/plan`), **Resources**
   (`/dashboard/resources`), **AI Assistant** (`/dashboard/assistant`),
   **Settings** (`/dashboard/settings`). Routes that don't exist yet get simple
   placeholder pages (or are stubbed) so links aren't dead. Keep the existing
   Projects/Integrations reachable (retain them in nav or fold under a section)
   so prior features stay accessible.
3. **Data — all placeholder/mock.** Hardcode realistic mock data under
   `src/data/mock/dashboard.ts` (welcome name, progress %, today's focus tasks,
   onboarding-progress steps, upcoming events, recommended reads, recent
   activity). No DB reads this slice; wire to real data later.

## Scope (this slice)

Rebuild `/dashboard` to match the reference, composed from small reusable card
components. **Mock data only.** No new server logic, no DB schema changes.

### Layout

- Two-column app shell: left **Sidebar** (updated labels), right **main**.
- Main is a responsive grid:
  - **Welcome banner** (full width): "Welcome back, {name} 👋", subtext, two CTAs
    ("Open today's tasks", "View my plan"), and a **circular progress ring**
    (e.g. 66%) with "Your progress".
  - Row: **Today's focus** (task list w/ durations + status dots, "View all
    tasks") and **My onboarding progress** (step list: Completed / In progress /
    Up next, "View full plan").
  - Row of three: **Upcoming** (events w/ Join), **Recommended next reads**
    (resource rows w/ chevrons), **Ask Onboardly** (prompt + sample question +
    "Ask another question").
  - **Recent activity** (full width): activity rows w/ dates, "View all
    activity".

### Components (reusable, under `src/components/dashboard/`)

- `WelcomeBanner` — greeting, CTAs, embedded `ProgressRing`.
- `ProgressRing` — SVG circular progress (size + value props), token-colored.
- `TodaysFocusCard` — task list (title, subtitle, duration, status dot).
- `OnboardingProgressCard` — step list with status (Completed/In progress/Up
  next) + leading status icon.
- `UpcomingCard` — event rows (title, datetime, Join button).
- `RecommendedReadsCard` — resource rows (icon, title, subtitle, chevron link).
- `AskOnboardlyCard` — sparkle header, blurb, a sample-question chip, "Ask
  another question".
- `RecentActivityCard` — activity rows (icon, text, date) + "View all activity".
- A shared `DashboardCard` wrapper (title + optional footer link) built on the
  existing `Card` primitive, to keep the cards consistent.

## Constraints / Standards

- **shadcn/ui + Tailwind v4 semantic tokens only** — no hardcoded colors; the
  purple theme + light/dark must both render correctly (reference shows both).
- **Fully responsive (mandatory):** mobile-first; verify at 390 / 768 / 1440.
  Cards stack to a single column on mobile, 2-up on tablet, the reference
  multi-column grid on desktop. Sidebar hides on mobile (existing `md:block`
  pattern) — ensure the dashboard is fully usable without it.
- Server Components by default; `"use client"` only where interactivity needs it
  (CTAs are links this slice; the progress ring is pure SVG, no client needed).
- Keep mock data in `src/data/mock/` (separate from production logic), typed via
  interfaces in `src/types`.
- `npm run lint` + `npm run build` pass; browser-verify the happy path at all
  three widths, light + dark.

## Out of Scope (later slices)

- Wiring any card to real data (tasks, progress, activity, resources).
- Functional "Ask Onboardly" (links to the existing chat surface is fine).
- The My Plan / Resources / AI Assistant / Settings detail pages beyond simple
  placeholders.
- Notifications, global search ("Search anything… ⌘K") behavior — render as
  static UI affordances only if included.
