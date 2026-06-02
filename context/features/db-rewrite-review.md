# DB Rewrite - Claude Review Handoff

> **Purpose:** single-file review brief for the greenfield database rewrite.
> **Branch:** `feature/db-rewrite`, created from freshly synced `development`.
> **State:** the normalization baseline was committed externally as `de2535c`
> (`DB Normalization and Code Adaptation`) and is present at
> `origin/development`. The create-project picker follow-up and context docs are
> uncommitted. Do not commit, push, merge, delete a branch, reset data, or remove
> fixtures without user approval.

## Review Goal

Review the normalized schema rewrite and the app data-access changes that point
the existing members feature at the new model. The members behavior was
preserved intentionally; this pass changes storage and access paths rather than
redesigning the feature.

The original implementation brief is
`context/features/db-rewrite-handoff.md`. Its schema heading has been corrected
from 18 to **19 tables**.

## Observed Branch State

During the create-project picker follow-up, the working tree changed externally:
the normalization implementation was committed as:

```text
de2535c DB Normalization and Code Adaptation
```

`feature/db-rewrite` and `origin/development` currently point to that commit.
Local `development` is one commit behind `origin/development`. The uncommitted
working tree now contains the create-project picker follow-up plus context-doc
changes listed below. This handoff records the state without reverting or
modifying the external commit.

## Locked Model

- Remove `organizations`. `projects.ownerId -> users.id`.
- Project access is governed only by an ACTIVE `project_members` row.
- Keep `ProjectRole = ADMIN | MEMBER`. The creator is an ACTIVE ADMIN member;
  `projects.ownerId` is the canonical creator marker.
- Replace `UserProfile` with provider-generic `user_identities`.
- Replace project repo/workspace columns and `integrations` with
  `project_connections`.
- Normalize knowledge as `documents -> document_chunks -> embeddings`.
- Normalize chat as `chats -> chat_messages -> message_citations`.
- Add `sync_jobs` history.
- Keep GitHub login join keys lowercased.
- Keep member removal soft (`status = REMOVED`) and re-add via upsert.
- Derive onboarding progress; do not persist a percent.

## Completed Work

### Schema And Remote Database

- Replaced `onboardly/prisma/schema.prisma` with the 19-table normalized schema.
- Ran the destructive remote reset only after explicit user approval:

  ```bash
  npm run db:push -- --force-reset
  ```

- Regenerated the Prisma client:

  ```bash
  npm run db:generate
  ```

- Confirmed the `vector` extension is enabled remotely.

### Identity

- Reworked `onboardly/src/lib/auth/profile.ts` around
  `upsertUserIdentity(user)`.
- Upserts `users`, then conditionally upserts a lowercased GitHub identity from
  Supabase `user_metadata`.
- Preserves a GitHub identity on later email login by only writing identity data
  when provider metadata exists.
- Updated OAuth callback and password login paths to run the best-effort
  identity upsert:
  - `onboardly/src/app/auth/callback/route.ts`
  - `onboardly/src/lib/auth/actions.ts`

### Membership-Only Access

- Removed the organization-owner access branch.
- `getProjectAccess(projectId)` now returns access only when the caller has an
  ACTIVE `project_members` row.
- Kept ADMIN mutation enforcement and the last-active-admin guard.
- Added a defensive access check inside roster reads.
- Updated:
  - `onboardly/src/lib/members/access.ts`
  - `onboardly/src/lib/members/queries.ts`
  - `onboardly/src/lib/members/actions.ts`
  - `onboardly/src/types/member.ts`

### Projects And Connections

- Removed organization auto-provisioning and organization-scoped reads.
- Project creation now:
  - resolves the current user;
  - defensively ensures a `users` row exists;
  - creates `projects.ownerId`;
  - creates the creator's ACTIVE ADMIN membership;
  - writes initial GitHub and Slack values to `project_connections`.
- Project edits upsert normalized connections instead of writing repo/workspace
  columns on `projects`.
- Project deletion remains ADMIN-gated.
- Added normalized connection read helpers.
- Updated:
  - `onboardly/src/lib/projects/actions.ts`
  - `onboardly/src/lib/projects/queries.ts`
  - `onboardly/src/lib/projects/connections.ts`
  - `onboardly/src/types/project.ts`
  - `onboardly/src/types/integrations.ts`
  - `onboardly/src/data/mock/projects.ts`

### GitHub Discovery

- Candidate discovery now reads the GitHub `project_connections` row and joins
  collaborators against lowercased `user_identities.externalLogin`.
- Installation ID lookup now reads and updates the normalized GitHub connection.
- Updated:
  - `onboardly/src/lib/members/candidates.ts`
  - `onboardly/src/lib/github/installation.ts`
  - `onboardly/src/lib/github/collaborators.ts`

### Knowledge And Chat

- RAG similarity search now joins:
  `embeddings -> document_chunks -> documents`.
- Retrieval is scoped through `documents.project_id`.
- Chat writes normalized citation rows instead of a JSON citation blob.
- Updated:
  - `onboardly/src/lib/rag/search.ts`
  - `onboardly/src/app/api/chat/route.ts`

### UI Repointing

- Repointed project overview, edit, members, dashboard, list, new-project, and
  API project paths to normalized project and connection data.
- Updated:
  - `onboardly/src/app/(auth)/dashboard/page.tsx`
  - `onboardly/src/app/(auth)/projects/page.tsx`
  - `onboardly/src/app/(auth)/projects/new/page.tsx`
  - `onboardly/src/app/(auth)/projects/[projectId]/page.tsx`
  - `onboardly/src/app/(auth)/projects/[projectId]/edit/page.tsx`
  - `onboardly/src/app/(auth)/projects/[projectId]/members/page.tsx`
  - `onboardly/src/app/api/projects/route.ts`

### Create-Project Connection Picker Follow-Up

- Updated `/projects/new` to load the signed-in user's GitHub repositories from
  the existing short-lived httpOnly OAuth provider-token cookie.
- Filters out repositories already referenced by any GitHub
  `project_connections` row.
- Replaced the create-mode free-text GitHub repo field with an optional
  repository dropdown. Private and GitHub-App-installed repositories are
  annotated in the options.
- Selecting a repo invokes a server action that revalidates availability, tries
  `GET /repos/{owner}/{repo}/readme`, populates the editable project name from
  the repo name, and populates the editable description from README text. It
  falls back to the GitHub repository description when no README exists or the
  README request fails.
- Project creation revalidates the selected repo server-side before writing its
  connection, so stale or tampered dropdown values are rejected.
- Create mode now renders a disabled Slack organizations picker with an
  explicit TODO. Edit mode retains the existing Slack text field until Slack
  OAuth exists.
- Guarded `projectConnection.createMany` so it is skipped when a new project
  has no initial connection rows.
- Follow-up UX hardening after live diagnosis:
  - repos without an Onboardly GitHub App installation remain linkable but are
    labeled `Install app for members` in the create dropdown;
  - selecting one shows an installation explanation and install link;
  - the members dialog also renders an `Install GitHub App` action when
    collaborator discovery is blocked by a missing installation.
- Added and updated:
  - `onboardly/src/lib/projects/github.ts`
  - `onboardly/src/lib/github/oauth.ts`
  - `onboardly/src/lib/projects/actions.ts`
  - `onboardly/src/components/projects/ProjectForm.tsx`
  - `onboardly/src/app/(auth)/projects/new/page.tsx`

### Scripts

- Reworked the demo seed for normalized rows:
  `onboardly/prisma/seed.ts`.
- Reworked the old owner backfill into an idempotent repair utility:
  `onboardly/scripts/backfill-owner-members.ts`.
- Expanded the read-only schema verifier:
  `onboardly/scripts/verify-members-schema.ts`.
- Added an idempotent membership/access fixture:
  `onboardly/scripts/verify-db-rewrite-data.ts`.
- Added a live GitHub App discovery fixture:
  `onboardly/scripts/verify-github-discovery.ts`.

## Verification Evidence

The following passed from `onboardly/`:

```bash
npx prisma format --schema prisma/schema.prisma
npm run db:push -- --force-reset
npm run db:generate
npx tsc --noEmit
npm run lint
npm run build
npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/verify-members-schema.ts
npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/verify-db-rewrite-data.ts
npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/backfill-owner-members.ts
npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/verify-github-discovery.ts
npm run db:seed
git diff --check
```

After the create-project picker follow-up, these were rerun successfully:

```bash
npx prettier --write src/lib/github/oauth.ts src/lib/projects/github.ts src/lib/projects/actions.ts 'src/app/(auth)/projects/new/page.tsx' src/components/projects/ProjectForm.tsx
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Notable results:

- Schema verifier: 19 tables, required enums and unique indexes present,
  `pgvector` enabled.
- Membership fixture: membership-only visibility passed; stranger isolation
  passed; single-admin precondition passed; soft-delete reactivation preserved
  progress.
- Owner repair: idempotent with no missing owner memberships after fixtures.
- Live GitHub discovery: installation ID `137499738` resolved for
  `htuco/htuco`; collaborators loaded; `altmahrum-web` was addable through
  `user_identities`.
- Runtime smoke after clearing a stale Next cache:
  - `/` -> `200`
  - `/login` -> `200`
  - unauthenticated `/projects` -> `307` to login
  - unauthenticated `POST /api/chat` -> `401`
- `npm run build` required outbound network access for Google Fonts and passed
  when rerun with approval.

Live collaborator diagnosis:

- `futureexperts/heap` (`heap` project): no visible GitHub App installation;
  collaborator discovery cannot run until the app is installed for that repo.
- `HarisS23/Flair` and demo `heap/onboardly`: same missing-installation state.
- Installed examples returned collaborators correctly:
  - `htuco/htuco`: 2 collaborators
  - `htuco/devstash`: 3 collaborators
  - `htuco/Deadshot`: 2 collaborators

## Remote Data Side Effects

The reset removed old remote rows. Verification and seed scripts then inserted
fixed fixture rows. The last schema verification after `npm run db:seed`
reported:

```text
users: 6
projects: 4
project_members: 6
user_identities: 5
project_connections: 4
```

`SEED_USER_ID` was not configured, so the demo seed used its documented
placeholder owner:

```text
00000000-0000-0000-0000-000000000000
```

Fixture cleanup or another reset is destructive and requires user approval.

## Review Checklist

### Required Code Review

- Confirm every project read and write that needs authorization is protected by
  membership access or ADMIN access as appropriate.
- Confirm no stale organization-owner access path remains.
- Confirm no stale `UserProfile`, `integrations`, project `githubRepo`, or
  project `slackWorkspace` access remains in executable code.
- Confirm lowercased GitHub login matching is consistent end to end.
- Confirm REMOVED members are excluded from access and roster results but remain
  re-addable.
- Confirm last ADMIN removal and demotion remain rejected server-side.
- Confirm chat citation writes and RAG joins match the normalized schema.
- Confirm create-mode GitHub repo filtering and create-time revalidation match
  the intended rule: one repository should not appear once any project has a
  GitHub connection for it.
- Confirm README text is acceptable as project description content without a
  size limit. The GitHub README endpoint bounds the response, but a product-level
  truncation policy may still be desirable.
- Confirm whether project creation should continue allowing repos without a
  GitHub App installation. Current behavior allows linking and clearly prompts
  for installation before collaborator discovery.

### Required Manual Browser Acceptance

An authenticated full browser acceptance pass is still pending. Run it at
390 / 768 / 1440:

1. Sign in with GitHub, open `/projects/new`, and confirm only unlinked repos
   appear in the create dropdown.
2. Select a repo with a README and confirm name and editable description
   populate. Select a repo without a README and confirm the description
   fallback behaves cleanly.
3. Create a project and confirm the creator appears as ACTIVE ADMIN.
4. Confirm the selected GitHub value renders from `project_connections` and no
   longer appears in another new-project dropdown. Confirm Slack is marked TODO.
5. Open Add Members and verify real collaborator states: addable, self,
   already-added, and no-account.
6. Add a collaborator, then confirm "Already added".
7. Sign in as a MEMBER and confirm read-only access with no Edit, Delete,
   Connect, or Add Members actions.
8. Sign in as a stranger and confirm project isolation (`notFound`).
9. Attempt direct MEMBER mutations and last-ADMIN removal/demotion.
10. Confirm zero-course progress renders "Not started" without divide-by-zero.

### Documentation Follow-Up

`context/tasks.md`, `context/coding-standards.md`, and older history inside
`context/current-feature.md` still contain old organization and `integrations`
language. Review and update the authoritative forward-looking text before merge
without rewriting historical notes that intentionally describe prior phases.

### Observed Residual Warning

During runtime smoke, an existing browser tab logged a React warning about a
`script` tag encountered while rendering a React component. It appears related
to the existing theme-init script and was not introduced by this rewrite.
Confirm separately if desired.

## Working Tree Inventory

Committed normalization baseline:

```text
onboardly/prisma/schema.prisma
onboardly/prisma/seed.ts
onboardly/scripts/backfill-owner-members.ts
onboardly/scripts/verify-db-rewrite-data.ts
onboardly/scripts/verify-github-discovery.ts
onboardly/scripts/verify-members-schema.ts
onboardly/src/app/(auth)/dashboard/page.tsx
onboardly/src/app/(auth)/projects/[projectId]/edit/page.tsx
onboardly/src/app/(auth)/projects/[projectId]/members/page.tsx
onboardly/src/app/(auth)/projects/[projectId]/page.tsx
onboardly/src/app/(auth)/projects/new/page.tsx
onboardly/src/app/(auth)/projects/page.tsx
onboardly/src/app/api/chat/route.ts
onboardly/src/app/api/projects/route.ts
onboardly/src/app/auth/callback/route.ts
onboardly/src/data/mock/projects.ts
onboardly/src/lib/auth/actions.ts
onboardly/src/lib/auth/profile.ts
onboardly/src/lib/db/prisma.ts
onboardly/src/lib/github/collaborators.ts
onboardly/src/lib/github/installation.ts
onboardly/src/lib/members/access.ts
onboardly/src/lib/members/actions.ts
onboardly/src/lib/members/candidates.ts
onboardly/src/lib/members/queries.ts
onboardly/src/lib/projects/actions.ts
onboardly/src/lib/projects/connections.ts
onboardly/src/lib/projects/queries.ts
onboardly/src/lib/rag/search.ts
onboardly/src/types/integrations.ts
onboardly/src/types/member.ts
onboardly/src/types/project.ts
```

Uncommitted picker follow-up and docs:

```text
context/current-feature.md
context/features/db-rewrite-handoff.md
context/features/db-rewrite-review.md
onboardly/src/app/(auth)/integrations/github/page.tsx
onboardly/src/app/(auth)/projects/[projectId]/members/page.tsx
onboardly/src/app/(auth)/projects/new/page.tsx
onboardly/src/components/members/AddMembersDialog.tsx
onboardly/src/components/projects/ProjectForm.tsx
onboardly/src/lib/github/oauth.ts
onboardly/src/lib/projects/actions.ts
onboardly/src/lib/projects/github.ts
```

Generated Prisma client output is git-ignored.

## Safety And Workflow Reminder

- Ask before destructive commands, especially DB reset, fixture cleanup, cache
  removal, branch deletion, or destructive Git commands.
- Do not commit or push without user permission.
- Before commit: finish the authenticated browser checklist, review the diff,
  rerun lint and build, then ask permission with a Title Case commit message.
