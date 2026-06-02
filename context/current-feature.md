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
- **Verified:** `next lint` + `next build` pass (0 errors, 0 warnings); browser-tested both themes via Playwright at multiple widths. Note: a stale pre-theme dev server initially served monochrome CSS — restarted clean to verify the real blue palette.

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
