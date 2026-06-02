# Project Members & Admin Spec

> **Companion file — always load with this spec:** the DB migration plan lives in
> `@./project-members-migration-plan.md`. Read it together with this spec; it
> governs how the `UserProfile` / `ProjectMember` / `LessonProgress` schema in
> §Data Model is applied (`db push`) and back-filled.

## Overview

Give projects a real **membership** layer with **project-level roles** and an admin surface to drive it. Today the model is single-owner (`Organization.ownerId` only): a user sees only the projects in the org they own, and there is no concept of a project member. This feature lets a project **admin** (the creator/lead) add other Onboardly developers to a project they administer, by **discovering GitHub repo collaborators** on the project's connected repo. Added developers become **members**: they can see the project, open its course + chat surfaces, and view the roster — but cannot edit/delete the project or change connections. A derived **onboarding %** is wired in now (stub-safe: shows "Not started" until the course system lands in Phases 8–10).

Identity is linked **by GitHub login first, email as fallback**. This is built on top of the existing **single Next.js app** (App Router, TypeScript, Prisma → Supabase, GitHub App/OAuth) and must be **fully responsive** (mobile/tablet/desktop) per `context/coding-standards.md`.

### Decisions locked for this build (resolved with the user)

| Question | Decision |
| -------- | -------- |
| How does the admin discover developers to add? | **Repo collaborators API** (`GET /repos/{owner}/{repo}/collaborators`) — people with *access*, so brand-new hires with 0 commits still appear. Not the contributors API. |
| Identity link (member → Onboardly user) | **GitHub login preferred, email fallback.** Match the collaborator's GitHub login against stored Onboardly profiles; use email only for manual/edge cases. |
| Must the developer already have an Onboardly account? | **Yes — must already exist** (with GitHub connected). No pre-signup invite system in this slice. |
| Collaborators with **no** Onboardly account? | **Shown greyed-out**, labeled "No Onboardly account" (informative, not addable). |
| Where do we get each user's GitHub login? | **New `UserProfile` table**, populated on GitHub login from Supabase `user_metadata`. Discovery = repo collaborators ∩ `UserProfile`. |
| What can a MEMBER see/do? | See project overview, access course + chat surfaces, view (read-only) members roster. **Cannot** edit/delete the project or connect/disconnect integrations. |
| "Projects I can see" after this feature | **Union**: projects in my org (owned, as today) **∪** projects where I'm an ACTIVE `ProjectMember` (possibly another org). |
| Build vs design by 17:00 deadline | **Build:** Members CRUD + roster, GitHub discovery import, member's cross-org project view, progress %-scaffold (stub-safe). |

---

## Data Model (new Prisma models — `prisma db push`, hackathon flow)

> Apply with `npm run db:push` from `onboardly/` (no migration history yet, consistent with Phase 1). Add the matching back-relations on `Project`, `Lesson`, etc. Tenant/role isolation stays in **app logic** (Prisma bypasses RLS).

### `UserProfile` — the Onboardly directory (NEW, foundational)

Maps a Supabase auth user to their GitHub identity so collaborator discovery can intersect "repo collaborators" with "real Onboardly users."

```prisma
model UserProfile {
  id          String   @id @default(uuid()) @db.Uuid
  /// Supabase auth.users.id — one profile per user.
  userId      String   @unique @map("user_id") @db.Uuid
  email       String?
  /// GitHub username (login), captured from OAuth user_metadata. The primary
  /// identity key for collaborator matching. Lowercased for case-insensitive match.
  githubLogin String?  @unique @map("github_login")
  displayName String?  @map("display_name")
  avatarUrl   String?  @map("avatar_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([githubLogin])
  @@map("user_profiles")
}
```

- **Populated on GitHub login.** In `auth/callback`, after `exchangeCodeForSession`, read `data.session.user`: `user.user_metadata.user_name` (GitHub login), `avatar_url`, `name`, and `user.email`. Upsert the `UserProfile` (by `userId`). Store `githubLogin` **lowercased**.
- Email-only users still get a profile (no `githubLogin`); they just won't match repo collaborators.

### `ProjectMember` — a person attached to a project

```prisma
model ProjectMember {
  id          String        @id @default(uuid()) @db.Uuid
  projectId   String        @map("project_id") @db.Uuid
  /// Supabase auth.users.id. Set immediately for this slice (members must already exist).
  userId      String        @map("user_id") @db.Uuid
  /// Snapshotted identity for display + dedupe. githubLogin lowercased.
  email       String?
  githubLogin String?        @map("github_login")
  displayName String?        @map("display_name")
  avatarUrl   String?        @map("avatar_url")
  role        ProjectRole    @default(MEMBER)
  source      MemberSource   @default(GITHUB)
  status      MemberStatus   @default(ACTIVE)
  courseId    String?        @map("course_id") @db.Uuid   // assigned onboarding course (Phase 8+)
  joinedAt    DateTime?      @map("joined_at")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  // courseId FK intentionally left soft (no relation) until Course assignment ships,
  // to avoid coupling this slice to the not-yet-built course generator.

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
  @@map("project_members")
}

enum ProjectRole   { ADMIN  MEMBER            @@map("project_role") }
enum MemberSource  { MANUAL GITHUB SLACK      @@map("member_source") }
enum MemberStatus  { INVITED ACTIVE REMOVED   @@map("member_status") }
```

- `@@unique([projectId, userId])` prevents adding the same person twice. (Email-based uniqueness isn't needed since members must already exist → we always have a `userId`.)
- `INVITED` / `SLACK` / `MANUAL` are kept in the enums for forward-compat but **not exercised** in this slice (GitHub-discovered, already-existing users → created `ACTIVE`).
- `Project` gains `members ProjectMember[]`.

### `LessonProgress` — drives the onboarding % (stub-safe scaffold)

```prisma
model LessonProgress {
  id          String         @id @default(uuid()) @db.Uuid
  memberId    String         @map("member_id") @db.Uuid
  lessonId    String         @map("lesson_id") @db.Uuid
  status      ProgressStatus @default(NOT_STARTED)
  completedAt DateTime?      @map("completed_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  member ProjectMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  lesson Lesson        @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([memberId, lessonId])
  @@index([memberId])
  @@map("lesson_progress")
}

enum ProgressStatus { NOT_STARTED IN_PROGRESS COMPLETED @@map("progress_status") }
```

- Add `progress LessonProgress[]` to both `ProjectMember` and `Lesson`, and `lessonProgress LessonProgress[]` (or reuse `progress`) on `ProjectMember`.
- **No `percent` column anywhere.** % is always derived (see below). Progress *writes* (marking lessons complete) come with the Course UI (Phase 9) — `T-MEM-6`; this slice only ships the table + the read/derivation so the roster has something to render.

### Onboarding % (derived, never stored)

```
completion% = COMPLETED LessonProgress rows for the member
              ───────────────────────────────────────────────  (rounded)
              total lessons in the member's assigned course
```

- Compute on read. **No assigned course or 0 lessons → "Not started" / 0%** (the expected state right now, before Phase 8). Never divide by zero.
- Recompute the denominator from the course's **current** lessons; ignore orphaned `LessonProgress` rows (so a regenerated course can't corrupt the %).

---

## Roles & Permissions (enforced in app logic)

- The project **creator** is auto-added as a `ProjectMember { role: ADMIN, status: ACTIVE, userId }` at create time (and back-filled for existing projects — see Migration Notes).
- **Admin** can: edit/delete the project, connect/disconnect GitHub & Slack, add/remove members, (later) assign courses, view everyone's roster + progress.
- **Member** can: see the project in their list + open the overview, course, and chat surfaces, and view the **read-only** roster. **Cannot** edit/delete/connect or add/remove members.
- **Access model — `getProjectAccess(projectId)`** returns `{ project, role: "ADMIN" | "MEMBER" } | null`:
  - `null` (→ `notFound()`) unless the caller is **(a)** the owner of the project's org, **or (b)** an ACTIVE `ProjectMember` of the project.
  - Org owner ⇒ effective role `ADMIN`. ACTIVE member ⇒ their `ProjectMember.role`.
- Every member/admin query is scoped by this access check. **Mutations (edit/delete/connect/add-member) require `role === "ADMIN"`** — re-check inside the server action, never trust the UI to hide a button.

---

## Cross-Org Project Visibility (the change that makes members real)

Today `listProjects()` / `getProject()` scope strictly to the current user's owned org. After this feature:

- **`listProjects()`** returns the **union** of:
  1. projects in the org the user owns (existing behavior), and
  2. projects where the user is an `ACTIVE` `ProjectMember` (any org).
  Dedupe by project id; tag each row with the caller's effective role (owner/admin vs member) so the UI can show an "Admin"/"Member" badge and hide admin actions.
- **`getProject(projectId)`** is superseded by **`getProjectAccess(projectId)`** for any page a member might reach. Keep `getProject` for admin-only mutations or have it delegate to the access check. Detail/course/chat pages use the access check; edit/delete pages require `ADMIN`.

> This is the single biggest behavioral change. Audit every existing `getProject` call site (overview, edit, course, chat, admin, delete action, update action) and route it through the right guard.

---

## Admin Flows

1. **Create project** (Phase 2, shipped) — extend: after `prisma.project.create`, insert the creator as `ProjectMember{ role: ADMIN, status: ACTIVE, userId, source: MANUAL, joinedAt: now }` in the same path.
2. **Connect GitHub repo** (Phase 3) — the project's `githubRepo` (`owner/name`) + a GitHub App **installation** on that repo is the prerequisite for discovery. If the repo isn't connected / App not installed, the Add-members dialog shows an empty state pointing to the connect flow.
3. **Add members (GitHub collaborator discovery)** — the core new logic:
   - Resolve the project's repo `owner/name` and its installation id (from the `Integration` row / `config`, or via the App's installation lookup for that repo).
   - `GET /repos/{owner}/{repo}/collaborators?per_page=100` with the **installation token** (`installationAuthHeaders`) → `[{ login, avatar_url, ... }]`. Paginate.
   - Fetch `UserProfile` rows whose lowercased `githubLogin` ∈ collaborator logins → these are **addable Onboardly users**.
   - Build the candidate list: each collaborator → `{ login, avatarUrl, onboardlyUser?: { userId, displayName, email } }`.
     - Has a profile **and** not already a member → **addable** (checkbox enabled).
     - Already a member → shown as "Already added" (disabled).
     - No profile → **greyed-out**, "No Onboardly account" (disabled).
     - The current admin themselves → excluded / shown as "You (admin)".
   - Admin checkbox-selects addable people, picks a **project role** (Member default; can promote to Admin) → "Add to project".
   - Server action: re-check caller is project ADMIN, then `createMany` `ProjectMember` rows (`source: GITHUB`, `status: ACTIVE`, snapshot `githubLogin`/`displayName`/`avatarUrl`/`email`, `userId` from the matched profile, `joinedAt: now`). Idempotent via `@@unique([projectId, userId])` (skip duplicates).
   - Course assignment (`courseId`) is **deferred** — leave null; the picker is added when the course generator ships.
4. **Roster + remove** — admin roster: avatar, name, GitHub login, role badge, status, **onboarding % bar** (derived; "Not started" for now), and a **Remove** action. **Remove = soft-delete:** set `status: REMOVED` (keep the row + its `LessonProgress`) and filter `status != REMOVED` from rosters, the candidate dedupe, and the cross-org access check. Re-adding a removed person flips their existing row back to `ACTIVE` (restoring prior progress) rather than inserting a new row. Admin cannot remove themselves if they're the **only** admin (guard).

---

## UI Surfaces

- **Members tab** — `src/app/(auth)/projects/[projectId]/members/page.tsx`:
  - **Admin view:** roster table/cards + **"Add members"** dialog (GitHub-collaborators tab populated now; Manual-by-email + Slack tabs stubbed/hidden for this slice). Each row: avatar, name/login, role, % bar, Remove.
  - **Member view:** same roster, **read-only** (no Add/Remove, no role controls).
- **Project overview** (`[projectId]/page.tsx`) — add a "Members" entry-point card alongside Course/Chat/Admin; show member count. Hide Edit/Delete for non-admins.
- **Admin dashboard** (`[projectId]/admin/page.tsx`, existing placeholder) — surface the members + progress overview here too (integration/sync status stays Phase 13). Admin-only.
- **Projects list + dashboard** — render the union list; badge each project Admin/Member.
- All surfaces **fully responsive**, verified at **390 / 768 / 1440** (hard requirement). Roster is a table on `lg+`, stacked cards on mobile. Use shadcn primitives (`Dialog`, `Checkbox`, `Avatar`, `Badge`, `Table`); add any missing ones via the shadcn CLI into `src/components/ui`.

---

## Files To Create / Edit

**Schema & data**
- `prisma/schema.prisma` — add `UserProfile`, `ProjectMember`, `LessonProgress` + the 4 enums + back-relations (**edit**); `npm run db:push`.
- `src/app/auth/callback/route.ts` — upsert `UserProfile` from `user_metadata` after session exchange (**edit**).
- `src/lib/auth/profile.ts` — `upsertUserProfile(user)` helper (**new**).

**Members data layer**
- `src/lib/members/access.ts` — `getProjectAccess(projectId)`, `requireProjectAdmin(projectId)` (**new**).
- `src/lib/members/queries.ts` — `listMembers(projectId)`, `computeOnboardingPercent(member)`, `listAccessibleProjects()` (the union) (**new**).
- `src/lib/members/actions.ts` — `addMembers`, `removeMember`, `setMemberRole` server actions (admin-gated) (**new**).
- `src/lib/github/collaborators.ts` — `listRepoCollaborators(owner, repo, installationId)` via installation token (**new**).
- `src/lib/members/candidates.ts` — build the discovery candidate list (collaborators ∩ `UserProfile`, annotate addable/already-member/no-account) (**new**).

**Project layer edits (cross-org visibility)**
- `src/lib/projects/queries.ts` — switch `listProjects` to the union; route reads through `getProjectAccess` (**edit**).
- `src/lib/projects/actions.ts` — `createProject` also inserts the ADMIN member; `update/delete` require ADMIN (**edit**).

**UI**
- `src/app/(auth)/projects/[projectId]/members/page.tsx` — roster + add dialog (**new**).
- `src/components/members/` — `MemberRoster`, `MemberRow`, `AddMembersDialog`, `MemberProgressBar`, `RoleBadge` (**new**).
- `src/app/(auth)/projects/[projectId]/page.tsx` + `admin/page.tsx` — entry points, admin-gated actions (**edit**).
- `src/components/ui/*` — add `dialog`, `checkbox`, `avatar`, `table` if missing (shadcn CLI).

**Types**
- `src/types/member.ts` — `Member`, `MemberCandidate`, `ProjectAccess`, `RosterMember` (**new**); import `ProjectRole`/`MemberStatus` from `@/generated/prisma/enums` in client components (keep the full client out of the bundle, per the Phase-2 pattern).

---

## Migration / Backfill Notes

- **Existing projects have no members.** After the schema push, back-fill: for each existing project, insert the org owner as `ProjectMember{ role: ADMIN, status: ACTIVE, userId: org.ownerId }`. One-off script or guarded on-read upsert (`ensureOwnerMembership`). Without this, the owner would still see the project (via the org-owner branch of the access check) but wouldn't appear on the roster.
- **Existing users have no `UserProfile`.** Profiles populate on next GitHub login. To make already-signed-up GitHub users immediately discoverable, optionally back-fill from Supabase or accept that they appear after their next login. (Acceptable for the demo; note in testing.)

---

## Key Gotchas

- **GitHub login is the join key, lowercased.** GitHub logins are case-insensitive; store and compare lowercased everywhere (`UserProfile.githubLogin`, collaborator match, snapshot).
- **Collaborators API needs the App installed with the right permission.** Listing collaborators requires the installation token to have repo access (Metadata read is enough to *read* collaborators on most repos; verify against the App's granted permissions). Empty/403 → show the "connect repo / install app" empty state, don't crash.
- **`provider_token` is short-lived** and **not** needed here — discovery uses the **App installation token** (persistent), not the user OAuth token. Don't depend on `gh_provider_token` for the members flow.
- **Role enforcement is app-side** (Prisma bypasses RLS): every mutation re-checks `requireProjectAdmin`; every read goes through `getProjectAccess`. Hiding a button is not security.
- **No double-add + reactivation** — `@@unique([projectId, userId])` means a removed person already has a row. `addMembers` must **upsert**: if a `REMOVED` row exists for `(projectId, userId)`, flip it back to `ACTIVE` (restoring progress); otherwise insert. Don't blindly `createMany` — that throws on the unique constraint for previously-removed members.
- **Filter `REMOVED` everywhere** — soft-deleted members must be excluded from the roster, the cross-org access check (`getProjectAccess` only counts `ACTIVE`), `listAccessibleProjects`, and the "already a member" annotation in the candidate list (a `REMOVED` collaborator should appear **addable** again, not "already added").
- **Don't lock out the last admin** — block removing/demoting the only ADMIN of a project.
- **Progress is derived** — never persist a percent; 0 lessons / no course ⇒ "Not started" (the normal state until Phase 8).
- **Cross-org leak risk** — the union must not let a member of project X in org B see *other* projects of org B. Membership grants access to **that one project**, never the whole foreign org.
- **Self in candidate list** — exclude the admin's own login from "addable" (they're already the ADMIN member).

---

## Environment Variables

- No new vars for the GitHub-collaborator path (reuses `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY`). Slack member import (deferred) would later need `users:read.email`.

---

## Testing (acceptance for "100% done")

Data layer (direct, like Phase 2) + browser click-through:

1. **Owner backfill / create** — create a project → creator is an ADMIN `ProjectMember`; roster shows them.
2. **Discovery** — with a repo connected (App installed), open Add-members: real repo collaborators list; those with an Onboardly profile are addable, the admin is excluded, non-users are greyed "No Onboardly account."
3. **Add** — select a developer → they become an ACTIVE MEMBER; re-opening the dialog shows them "Already added" (no duplicate; idempotent).
4. **Member cross-org view** — sign in as that developer (different org) → the project appears in *their* projects list with a "Member" badge; overview, course, and chat open; **Edit/Delete/Connect and Add-members are absent**; roster is read-only.
5. **Isolation** — the member can see **only** that project from org B, not org B's other projects; a stranger (no membership) gets `notFound()`.
6. **Role guard** — a MEMBER hitting `removeMember`/`updateProject`/`addMembers` server actions directly is rejected (admin-only); the last admin cannot be removed/demoted.
7. **Progress %** — roster renders "Not started" / 0% cleanly with no course assigned (no divide-by-zero); when `LessonProgress` rows exist, % = completed/total.
8. **Responsive** — members page + dialog verified at 390 / 768 / 1440; roster reflows table → cards.
9. **Checks** — `npm run lint` + `npm run build` pass (0 errors) from `onboardly/`.

---

## Open Questions / Deferred (call out before/while building)

- ~~Remove = soft vs hard-delete?~~ **Decided: soft-delete** (`status: REMOVED`, keep row + progress, filter `status != REMOVED` everywhere; re-add reactivates the existing row). See Admin Flows §4.
- **Course assignment UI** — deferred until the course generator (Phase 8) exists; `courseId` stays null, no picker yet.
- **Manual-by-email & Slack import tabs** — stubbed/hidden this slice (enums keep `MANUAL`/`SLACK`/`INVITED` for forward-compat).
- **Pre-signup invites** — out of scope (members must already exist). The `INVITED` status + email-linking flow is a later slice if needed.
- **`UserProfile` backfill for existing users** — they appear after their next GitHub login unless we back-fill; acceptable for the demo.

---

## References

- `context/roadmap.md` — Phases 2 (project mgmt, done), 3 (GitHub), 8/9 (course + progress), 11 (ownership), 13 (admin dashboard).
- `context/tasks.md` — `T-MEM-1..6`, `T-ADMIN-1`.
- Existing code: `src/lib/projects/{queries,actions}.ts` (org-scoped CRUD, the patterns to follow), `src/lib/github/client.ts` (`installationAuthHeaders`), `src/lib/github/oauth.ts`, `src/app/auth/callback/route.ts` (where `UserProfile` capture hooks in), `prisma/schema.prisma` (`Project`, `Lesson`, `Integration`).
