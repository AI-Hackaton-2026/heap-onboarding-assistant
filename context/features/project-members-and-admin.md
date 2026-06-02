# Project Members & Admin Spec

## Overview

Give projects a real **membership + progress** layer and an **admin** surface on top of it. Today the data model is single-owner (`Organization.ownerId` only) — there is no concept of a project member, an assigned course, or per-person progress, so "view a hire's onboarding %" has nothing to compute from. This feature adds members (invited or imported from GitHub contributors / Slack users), per-member onboarding progress, project-level roles, and an admin dashboard to drive it all. Identity across sources is keyed on **email**.

## Requirements

### Data model (new Prisma models — design, not built in the Phase-2 branch)

- **`ProjectMember`** — a person attached to a project.
  - `id`, `projectId` (FK → Project, cascade)
  - `userId` (Supabase `auth.users.id`, **nullable** until the invitee signs up)
  - `email` — the **identity key**; how we invite and dedupe across GitHub/Slack
  - `role` — enum `ProjectRole { ADMIN | MEMBER }`
  - `source` — enum `MemberSource { MANUAL | GITHUB | SLACK }`
  - `externalRef` — GitHub login or Slack user id (nullable; for imported members)
  - `displayName`, `avatarUrl` (nullable)
  - `status` — enum `MemberStatus { INVITED | ACTIVE | REMOVED }`
  - `courseId` (nullable FK → Course) — the assigned onboarding course
  - `invitedAt`, `joinedAt` (nullable), `createdAt`, `updatedAt`
  - `@@unique([projectId, email])`, `@@index([projectId])`, `@@index([userId])`
- **`LessonProgress`** — the unit that drives the %.
  - `id`, `memberId` (FK → ProjectMember, cascade), `lessonId` (FK → Lesson, cascade)
  - `status` — enum `ProgressStatus { NOT_STARTED | IN_PROGRESS | COMPLETED }`
  - `completedAt` (nullable), `updatedAt`
  - `@@unique([memberId, lessonId])`
- **`ChecklistProgress`** (optional, finer grain) — `id`, `memberId`, `checklistItemId`, `done`, `@@unique([memberId, checklistItemId])`.
- **`QuizAttempt`** (optional) — `id`, `memberId`, `quizId`, `score`, `passed`, `attemptedAt`.

> Add the matching back-relations on `Project`, `Course`, `Lesson`, `ChecklistItem`, `Quiz`. Apply via `prisma db push` (same hackathon flow as Phase 1). Keep tenant isolation in app logic — Prisma bypasses RLS.

### Onboarding % (derived, never a stored counter)

```
completion% = COMPLETED LessonProgress rows for the member
              ───────────────────────────────────────────────
              total lessons in the member's assigned course
```

- Compute on read; 0 lessons or no assigned course → show "Not started" / 0%.
- Later, optionally weight checklists/quizzes into the score — start with lessons only.

### Roles & permissions (enforced in app logic)

- A project's creator is auto-added as a `ProjectMember` with `role = ADMIN`.
- **Admin** can: create/edit/delete the project, connect/disconnect GitHub & Slack, add/remove members, assign courses, view everyone's progress.
- **Member** can: see their own assigned course + chat + their own progress only.
- Every query stays scoped to the current user's org **and** their project role.

### Admin flows

1. **Create project** — already shipped (Phase 2). Add: on create, insert the creator as `ProjectMember{ role: ADMIN, status: ACTIVE, userId }`.
2. **Connect GitHub repo + Slack org** — write to the existing `Integration` table (Phase 3 / Phase 5). Connection unlocks the contributor/user import below.
3. **Add members (import from contributors)** — the core new logic:
   - GitHub: with the installation token, `GET /repos/{owner}/{repo}/contributors` → `[{ login, avatar_url, contributions }]`.
   - Slack: with the bot token, `users.list` → `[{ id, real_name, profile.email }]`.
   - Merge into one candidate list, **deduped by email** where available.
   - Admin checkbox-selects people → assigns each a **course** (by role) + a **project role** → "Add to project".
   - Upsert `ProjectMember(source, externalRef, email, status=INVITED)`; (optionally) send a Supabase Auth invite email.
   - On first sign-in, **match by email** → link `userId`, flip `status` to `ACTIVE`.
   - Seed `LessonProgress` lazily (on first course view) or eagerly at add-time.
4. **View members' onboarding %** — admin roster: avatar, name, role, assigned course, **% progress bar**, status, last-active, "stuck on lesson X" (lowest incomplete lesson).

### UI surfaces

- **Members tab** under the project (`/projects/[projectId]/members`) — roster + "Add members" dialog (GitHub/Slack/manual-by-email tabs).
- **Admin dashboard** (`/projects/[projectId]/admin`, already a placeholder route) — integration/sync status (Phase 13) **plus** the members + progress overview.
- All of it **fully responsive** (mobile/tablet/desktop) per `context/coding-standards.md`.

## Files to Create (when built)

- `prisma/schema.prisma` — add the models/enums above (edit).
- `src/lib/members/queries.ts` — list members, compute onboarding % (org + role scoped).
- `src/lib/members/actions.ts` — add/remove/invite members, assign course, set role.
- `src/lib/github/contributors.ts` — fetch repo contributors via installation token.
- `src/lib/slack/users.ts` — fetch workspace users via bot token.
- `src/lib/members/candidates.ts` — merge + dedupe GitHub/Slack candidates by email.
- `src/app/(auth)/projects/[projectId]/members/page.tsx` — roster + add-members UI.
- `src/components/members/*` — `MemberRoster`, `AddMembersDialog`, `ProgressBar`, `MemberRow`.

## Key Gotchas

- **Email may be missing** — GitHub contributors often hide email; Slack email needs `users:read.email` scope. Members without an email can still be added with `externalRef`, but won't auto-link on signup until an email is provided.
- **No double counting** — `ProjectMember` is unique per `[projectId, email]`; importing the same person from both GitHub and Slack must upsert, not duplicate.
- **Progress is derived** — never store a `percent` column; compute from `LessonProgress` so it can't drift when a course is regenerated/edited.
- **Course regeneration** — if a course's lessons change, existing `LessonProgress` rows may point at removed lessons; recompute the denominator from current lessons and ignore orphans.
- **Role enforcement is app-side** — Prisma bypasses RLS, so every member/admin query must check the caller's project role explicitly.

## Environment Variables

- Slack import needs the `users:read.email` scope on the Slack App (in addition to the Phase-5 scopes) to read member emails.

## Testing

- Create project → creator appears as ADMIN member.
- Connect a repo → "Add members" lists real contributors; selecting + adding creates INVITED members deduped by email.
- Assign a course, mark lessons complete → roster % updates and matches `completed / total lessons`.
- Sign in as an invited email → member links (`userId` set, status ACTIVE); a MEMBER cannot see the admin roster or other members' progress.

## References

- `context/roadmap.md` — Phases 8/9 (course + progress), 11 (ownership), 13 (admin dashboard).
- `context/tasks.md` — tasks `T-MEM-*` (membership/admin), `T-COURSE-*` (course + progress), `T-ADMIN-1`.
- Existing: `src/lib/github/client.ts` (installation token), `Integration` model, `Course → Module → Lesson` chain.
