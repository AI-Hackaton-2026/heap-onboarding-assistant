# Project Members & Admin — Migration Plan

> Schema migration for the membership/admin flow. Companion to
> `context/features/project-members-and-admin.md` (the feature spec) and
> `T-MEM-1` in `context/tasks.md`. This file covers **only the DB change**:
> what's added, how it's applied, and how existing data is back-filled.

## Current DB state (confirmed against live Supabase)

12 tables, matching `prisma/schema.prisma` exactly — `organizations`, `projects`,
`documents`, `embeddings`, `courses`, `modules`, `lessons`, `checklist_items`,
`quizzes`, `chats`, `chat_messages`, `integrations`. pgvector enabled
(`embeddings.embedding vector(768)`). **No** `user_profiles`, `project_members`,
or `lesson_progress` yet.

> ⚠️ **Schema-screenshot note:** `organizations` shows the owner column as
> **`ownerId`** (camelCase), not `owner_id`. The Prisma field is `ownerId` with
> **no `@map`**, so Postgres stores it literally as `"ownerId"`. The back-fill
> SQL below quotes it as `"ownerId"` accordingly. (If a later cleanup adds
> `@map("owner_id")`, that's a *separate* rename migration — out of scope here.)

## Migration mechanism

Same hackathon flow as Phase 1 — **`prisma db push`**, no SQL migration files
(`prisma/migrations` stays empty; `prisma migrate dev` is intentionally unused).
`db push` is **additive** here — three new tables + four new enums + new
relation fields on existing models. It does **not** alter or drop any existing
column, so it's non-destructive on the current data.

```bash
cd onboardly
# 1. Edit prisma/schema.prisma (add models/enums/relations — see spec §Data Model)
npm run db:generate     # regenerate the typed client into src/generated/prisma
npm run db:push         # sync schema to Supabase (additive)
# 2. Run the back-fill (see "Back-fill" below)
```

`db push` connects via `DIRECT_URL` (session pooler, 5432) per `prisma.config.ts`.

---

## Step 1 — New enums

```prisma
enum ProjectRole    { ADMIN  MEMBER                 @@map("project_role") }
enum MemberSource   { MANUAL GITHUB SLACK           @@map("member_source") }
enum MemberStatus   { INVITED ACTIVE REMOVED        @@map("member_status") }
enum ProgressStatus { NOT_STARTED IN_PROGRESS COMPLETED @@map("progress_status") }
```

`INVITED` / `SLACK` / `MANUAL` are reserved for forward-compat (invite + Slack
import are deferred); this slice only creates `ACTIVE` GitHub members.

## Step 2 — New tables

**`user_profiles`** — Onboardly directory; maps Supabase `userId` → GitHub login
so collaborator discovery can intersect "repo collaborators" with "real users."
Standalone (no FK to `auth.users`, which Prisma doesn't manage).

**`project_members`** — a person on a project, with project role + status.
FK `project_id → projects(id)` **ON DELETE CASCADE** (deleting a project removes
its members). `@@unique([projectId, userId])` makes add idempotent + enables the
reactivate-on-re-add path. No FK on `courseId` (soft pointer until the course
generator ships).

**`lesson_progress`** — derived-% source. FKs to `project_members(id)` and
`lessons(id)`, both **ON DELETE CASCADE**. `@@unique([memberId, lessonId])`.

> Exact Prisma model bodies live in the spec (`§Data Model`); don't duplicate
> them here — edit `schema.prisma` from the spec, this file governs *applying* it.

## Step 3 — Relation fields on existing models (additive, no column change)

These add Prisma-side back-relations only (the FK columns live on the new
tables). No change to existing tables' columns:

- `Project`  → `members ProjectMember[]`
- `Lesson`   → `progress LessonProgress[]`

`ProjectMember` carries `progress LessonProgress[]`. `UserProfile` has no
relations (matched in app logic by `userId` / `githubLogin`).

---

## Back-fill (run once, right after `db push`)

`db push` only creates structure — existing rows need seeding so the feature
works on day one. Two back-fills:

### B1 — Owner → ADMIN member for every existing project

Without this, an existing project's owner can still *see* it (via the org-owner
branch of `getProjectAccess`) but won't appear on its roster.

Idempotent SQL (safe to re-run; relies on the unique constraint):

```sql
INSERT INTO project_members (id, project_id, user_id, role, source, status, joined_at, created_at, updated_at)
SELECT gen_random_uuid(),
       p.id,
       o."ownerId",          -- NB: camelCase column, see note above
       'ADMIN', 'MANUAL', 'ACTIVE',
       now(), now(), now()
FROM projects p
JOIN organizations o ON o.id = p.organization_id
ON CONFLICT (project_id, user_id) DO NOTHING;
```

> Prefer to do this in app code instead? Add an `ensureOwnerMembership(projectId)`
> upsert that the project pages call on read — same effect, no manual SQL. Either
> is fine; the SQL is faster for the one-time backfill of existing rows.

### B2 — UserProfile for existing users

New profiles populate automatically on each user's **next GitHub login** (the
`auth/callback` upsert added in `T-MEM-1`). For the demo we accept that
already-signed-up users become discoverable only after they log in again.

Optional eager back-fill (only if you need everyone discoverable immediately):
read `auth.users` via the Supabase **service-role** client (server-side) and
upsert `user_profiles` from `raw_user_meta_data->>'user_name'`,
`->>'avatar_url'`, `->>'name'`, and `email`. Store `github_login` **lowercased**.
Not required to ship; note it in testing if skipped.

---

## Forward dependency (not part of this migration)

Discovery (`T-MEM-3`) reads the project's GitHub **installation id** to mint a
collaborators-scoped token. That id is **not stored yet** — it lands in
`integrations.config` (JSON) when the repo-connection flow `T-GH-1` ships. Until
then the Add-members dialog shows the "connect repo / install app" empty state.
No schema change needed for it (the `integrations` table already exists).

---

## Rollback / safety

- **Additive + non-destructive:** the push adds tables/enums/relations only; no
  existing column is altered or dropped, so existing data is untouched.
- **Reverting:** drop the three tables + four enums (`DROP TABLE ... CASCADE`,
  `DROP TYPE ...`) and remove the relation fields from `schema.prisma`, then
  `db push` again. The cascade FKs mean dropping `project_members` also clears
  `lesson_progress`.
- **No production data at stake** (hackathon DB), but run `db push` against the
  Supabase project, eyeball the three new tables in the dashboard, then run B1
  and confirm each existing project has exactly one `ADMIN` member.

## Verification checklist

- [ ] `npm run db:push` succeeds; `user_profiles`, `project_members`,
      `lesson_progress` appear in Supabase with the right columns + enums.
- [ ] FKs + cascades present (`project_members.project_id`,
      `lesson_progress.member_id`, `lesson_progress.lesson_id`).
- [ ] Unique constraints exist: `project_members(project_id, user_id)`,
      `lesson_progress(member_id, lesson_id)`, `user_profiles(user_id)`,
      `user_profiles(github_login)`.
- [ ] B1 ran: every existing project has its org owner as an `ACTIVE` `ADMIN`
      member; re-running B1 is a no-op (ON CONFLICT DO NOTHING).
- [ ] A fresh GitHub login creates/updates a `user_profiles` row with a
      lowercased `github_login`.
- [ ] `npm run lint` + `npm run build` pass with the regenerated client.
