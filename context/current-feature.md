# Current Feature

## Status

Not Started

## Goals

## Notes

## History

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
