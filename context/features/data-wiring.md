
# Data Wiring Spec

## Overview
1–2 sentences: Wire live data from our backend services and `src/lib/*` adapters into the authenticated app views (Overview, My Plan, Resources, AI Assistant, Settings) so the current mock/stub content is replaced with real data and the UI updates correctly for authenticated users.

## Requirements
- Overview: show user profile, onboarding progress, recent activity, and recommended reads using `src/lib/members`, `src/lib/projects`, `src/lib/course`, and `src/lib/documents`.
- My Plan: render the user's current plan items and progress from `src/lib/course` / `src/lib/projects` with completion status and due dates.
- Resources: list documents and collections from `src/lib/documents` (with pagination) and surface “embed” / view actions.
- AI Assistant: send conversation messages via `src/app/api/chat` and use `src/lib/rag` (or `src/lib/ai`) for knowledge retrieval; show recent assistant suggestions and conversation history.
- Settings: load and allow editing of user profile and team settings via `src/lib/members` and appropriate API routes; surface read-only fields where editing is not in-scope.
- Authentication & auth flow: all data fetches must run under the existing authenticated server session; use server components where possible and fall back to client components for interactive features.
- Data contracts: define minimal shapes for each UI block (examples below). Components must handle empty, loading, and error states.
- Performance: fetch only the data required for the visible widgets on the page; use parallel fetches and caching (stale-while-revalidate) at server-render boundary.
- Security: never expose secrets to client; authorization enforced server-side for all API calls.

## Data Shapes (examples)
- User profile:
	- { id: string, name: string, avatarUrl?: string, role?: string, orgId?: string }
- Onboarding progress:
	- { totalSteps: number, completedSteps: number, nextStep?: { id, title } }
- Recent activity item:
	- { id, type: 'doc'|'course'|'comment'|'task', title, timestamp, meta }
- Plan item:
	- { id, title, dueAt?: ISODate, status: 'todo'|'in_progress'|'done' }
- Document list page:
	- { id, title, excerpt, updatedAt, ownerId, visibility }

## Files To Update
- UI dashboard components (replace mocks with props from libs):
	- `src/components/dashboard/WelcomeBanner.tsx`
	- `src/components/dashboard/OnboardingProgressCard.tsx`
	- `src/components/dashboard/RecentActivityCard.tsx`
	- `src/components/dashboard/RecommendedReadsCard.tsx`
- Plan & resources components:
	- `src/components/dashboard/TodaysFocusCard.tsx`
	- `src/components/documents/DocumentsCard.tsx`
	- `src/components/documents/DocumentList.tsx`
- AI Assistant and chat:
	- `src/components/dashboard/AskOnboardlyCard.tsx`
	- `src/app/api/chat/route.ts` (ensure server handler implements required behavior)
- Lib adapters and server helpers to call from pages (if missing or thin):
	- `src/lib/members`
	- `src/lib/projects`
	- `src/lib/course`
	- `src/lib/documents`
	- `src/lib/rag` or `src/lib/ai`
- Pages / server components (wire fetches and pass props):
	- Authenticated dashboard: `src/app/(auth)/dashboard/page.tsx`
	- Resources page: `src/app/(auth)/documents/page.tsx`
	- AI Assistant page: `src/app/(auth)/ai-assistant/page.tsx`
	- Settings page: `src/app/(auth)/settings/page.tsx`

## Key Gotchas
- Server vs client components: interactive chat and editable fields require client components; fetch data in server components and pass down as props to minimize client work.
- Pagination & large lists: implement cursor/offset pagination in `src/lib/documents` and reflect next/prev behavior in the UI.
- Race conditions: parallelize independent fetches but guard dependent calls (e.g., org-specific queries need orgId from profile).
- Caching: choose SSG/ISR only where data can be slightly stale; for user-specific dashboards prefer server rendering per-request with short caching.
- Third-party rate limits: AI/RAG calls may be rate-limited; add circuit-breaker/backoff at `src/lib/rag`.
- Type mismatches: ensure lib adapters export typed interfaces that UI components import.

## Environment Variables
- (No new env vars expected if using existing libs) If adding RAG/AI endpoints:
- `RAG_API_KEY` — key for vector search / RAG provider
- `AI_SERVICE_ENDPOINT` — optional override for AI assistant

## Testing
- Manual browser steps:
	- Login as a test user → open Overview: verify WelcomeBanner shows user name and avatar; OnboardingProgressCard shows numeric progress; RecentActivityCard lists recent items.
	- Open My Plan: confirm plan items load, marking complete updates UI state.
	- Open Resources: verify document list loads, pagination works, document view/embed opens.
	- Open AI Assistant: type a question, verify chat messages post to `/api/chat` and the assistant returns a response.
	- Open Settings: verify read-only and editable fields load correctly.
- Automated checks:
	- Unit test lib adapters return expected shapes (mock network).
	- Integration tests for page server components: render with mock `src/lib/*` adapters and assert presence of critical UI strings.
- Failure cases to verify:
	- No documents → Resources shows empty state.
	- API error → each card shows appropriate error state and retry affordance.

## References
- Sidebar screenshot (UI items to wire): provided in task context.
- Existing components to model behavior: see `src/components/dashboard/ComingSoon.tsx` for patterns used across cards.

---

zamjeniti WORKSPACE pageve da su gore prvi ispid overviewa

a sve ostali my plan resources ai assistant i settigng nek predje ispod dole workspace

na overview veliko dugme na projekte

and also do this