# DB Rewrite — Codex Handoff Brief

> **Owner:** Codex (new branch). **Author of brief:** prior session.
> **Branch:** create `feature/db-rewrite` off `development` (do NOT do this on
> `feature/project-members-and-admin` — that branch's members feature is being
> committed/pushed as-is; you fold it into the new model on your branch).
> **Workflow:** follow `context/ai-interaction.md` (document → branch → implement
> → lint+build → browser-test → commit with permission → merge). Commit messages
> in **Title Case**; never add "Generated With Claude" / `Co-Authored-By`.

---

## Why this rewrite

We are **rewriting the entire database greenfield** and reorganizing the app code
to match. Two drivers:

1. **Normalization.** Today's schema has denormalized columns (repo/Slack on
   `projects`, citations as JSON on `chat_messages`, text+vector+source all on
   one `embeddings` row). We split these into proper tables.
2. **Drop `organizations`.** The org-as-tenant layer is removed. **Projects are
   owned directly by a user** (`projects.ownerId → users`) and **access is
   governed solely by `project_members`**. The org-owner special-case in the
   access guard is deleted. (It was the source of the "Unknown owner" roster bug:
   the owner had access via the org branch but no real member row.)

No data migration — the remote Supabase DB is **dropped and rebuilt** with
`prisma db push --force-reset`. This matches the project's existing "db push, no
migration history" convention (hackathon flow). **There is no production data to
preserve.**

---

## Locked decisions (do not re-litigate)

| Decision | Value |
| --- | --- |
| Tenant model | **No orgs.** `projects.ownerId → users`; access = `project_members` only. |
| Project roles | **`ProjectRole = ADMIN \| MEMBER`** (NO `OWNER` value). Creator = `ADMIN` member; `projects.ownerId` is the canonical creator marker. |
| Global roles | **`app_roles`** table with `AppRole = SUPERADMIN` (app owners). Absent row = normal user. |
| Identity | **`UserProfile` → `user_identities`** (generic per-provider). One row per `(user, provider)`. `isLogin` flag = sign-in method vs connected-later handle. |
| Identity population | **Write on login from `user_metadata`** (same pattern as today's profile upsert). Do NOT sync from Supabase `auth.identities`. |
| Provider linking | A user can have **both** GitHub and Slack identities; both can be login methods OR connected-later. |
| Connections | **`projects.githubRepo/slackWorkspace` + `integrations` → one `project_connections` table** (row per provider). |
| Create UX | **`createProject` keeps repo/Slack inputs** → writes `project_connections` rows immediately. Don't drop the inputs. |
| Chat | **`chats → chat_messages → message_citations`** (citations = rows, not JSON). |
| Knowledge | **`documents → document_chunks → embeddings`** (embeddings 1:1 with chunk). |
| Sync status | **`sync_jobs`** table (run history) for the Phase-13 admin dashboard. |
| Deferred (model later) | Knowledge-graph, ownership/`feature_owners`, `OrgContact`. Do NOT add now. |

---

## Target schema (18 tables)

Replace `prisma/schema.prisma` wholesale. **Keep** from the current file: the
`generator client` block (output `../src/generated/prisma`, `prisma-client`,
`postgresqlExtensions`), the `datasource db` block with `extensions = [vector,
pgcrypto, uuidOssp(...), pgStatStatements(...)]`, snake_case `@@map` on every
model, `@db.Uuid` PKs with `@default(uuid())`, cascade FKs, and the
`Unsupported("vector(768)")?` embedding column. `prisma.config.ts` is unchanged.

### Identity & global roles

```prisma
model User {
  id          String   @id @db.Uuid            // = Supabase auth.users.id (no FK; Prisma doesn't own auth schema)
  email       String?
  displayName String?  @map("display_name")
  avatarUrl   String?  @map("avatar_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  appRole       AppRole?
  identities    UserIdentity[]
  ownedProjects Project[]        @relation("ProjectOwner")
  memberships   ProjectMember[]
  chats         Chat[]

  @@map("users")
}

model AppRole {
  userId    String   @id @map("user_id") @db.Uuid
  role      AppRoleType
  grantedAt DateTime @default(now()) @map("granted_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("app_roles")
}

enum AppRoleType { SUPERADMIN  @@map("app_role_type") }

model UserIdentity {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  provider      Provider
  externalId    String?  @map("external_id")          // provider user id
  externalLogin String   @map("external_login")        // github login / slack handle — LOWERCASED join key
  avatarUrl     String?  @map("avatar_url")
  isLogin       Boolean  @default(true) @map("is_login")
  raw           Json?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@unique([provider, externalLogin])
  @@index([externalLogin])
  @@map("user_identities")
}

enum Provider { GITHUB SLACK  @@map("provider") }
```

### Projects (no org)

```prisma
model Project {
  id          String        @id @default(uuid()) @db.Uuid
  ownerId     String        @map("owner_id") @db.Uuid     // replaces organizationId
  name        String
  description String?
  status      ProjectStatus @default(DRAFT)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  owner       User                @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     ProjectMember[]
  connections ProjectConnection[]
  syncJobs    SyncJob[]
  documents   Document[]
  courses     Course[]
  chats       Chat[]

  @@index([ownerId])
  @@map("projects")
}

enum ProjectStatus { DRAFT SYNCING READY ERROR  @@map("project_status") }

model ProjectMember {
  id              String       @id @default(uuid()) @db.Uuid
  projectId       String       @map("project_id") @db.Uuid
  userId          String       @map("user_id") @db.Uuid
  email           String?
  githubLogin     String?      @map("github_login")
  displayName     String?      @map("display_name")
  avatarUrl       String?      @map("avatar_url")
  role            ProjectRole  @default(MEMBER)
  source          MemberSource @default(GITHUB)
  status          MemberStatus @default(ACTIVE)
  assignedCourseId String?     @map("assigned_course_id") @db.Uuid   // soft pointer, no FK (course deferred)
  joinedAt        DateTime?    @map("joined_at")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  project  Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  progress LessonProgress[]

  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
  @@map("project_members")
}

enum ProjectRole  { ADMIN MEMBER                @@map("project_role") }   // NO OWNER — see locked decisions
enum MemberSource { MANUAL GITHUB SLACK         @@map("member_source") }
enum MemberStatus { INVITED ACTIVE REMOVED      @@map("member_status") }

model ProjectConnection {
  id             String           @id @default(uuid()) @db.Uuid
  projectId      String           @map("project_id") @db.Uuid
  provider       Provider
  externalRef    String?          @map("external_ref")      // "owner/repo" | workspace id
  installationId String?          @map("installation_id")
  config         Json?
  status         ConnectionStatus @default(DISCONNECTED)
  connectedAt    DateTime?        @map("connected_at")
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, provider])
  @@index([projectId])
  @@map("project_connections")
}

enum ConnectionStatus { DISCONNECTED CONNECTED ERROR  @@map("connection_status") }
```

### Sync history

```prisma
model SyncJob {
  id         String     @id @default(uuid()) @db.Uuid
  projectId  String     @map("project_id") @db.Uuid
  kind       SyncKind
  status     SyncStatus @default(RUNNING)
  startedAt  DateTime   @default(now()) @map("started_at")
  finishedAt DateTime?  @map("finished_at")
  error      String?
  createdAt  DateTime   @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("sync_jobs")
}

enum SyncKind   { GITHUB SLACK EMBEDDING COURSE  @@map("sync_kind") }
enum SyncStatus { RUNNING SUCCESS ERROR          @@map("sync_status") }
```

### Knowledge

```prisma
model Document {
  id          String    @id @default(uuid()) @db.Uuid
  projectId   String    @map("project_id") @db.Uuid
  source      DocSource
  title       String?
  sourceRef   String?   @map("source_ref")       // file path / doc name / channel — stable citation key
  storagePath String?   @map("storage_path")     // Supabase Storage key (uploads)
  mimeType    String?   @map("mime_type")
  rawText     String?   @map("raw_text")
  metadata    Json?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  project Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  chunks  DocumentChunk[]

  @@index([projectId])
  @@map("documents")
}

enum DocSource { GITHUB SLACK UPLOAD REPO_SUMMARY  @@map("doc_source") }

model DocumentChunk {
  id         String   @id @default(uuid()) @db.Uuid
  documentId String   @map("document_id") @db.Uuid
  chunkIndex Int      @map("chunk_index")
  content    String
  citation   String                                  // "GitHub: backend/README.md"
  createdAt  DateTime @default(now()) @map("created_at")

  document  Document         @relation(fields: [documentId], references: [id], onDelete: Cascade)
  embedding Embedding?
  citations MessageCitation[]

  @@index([documentId])
  @@map("document_chunks")
}

model Embedding {
  chunkId   String @id @map("chunk_id") @db.Uuid     // 1:1 with chunk
  embedding Unsupported("vector(768)")?              // raw-SQL similarity search (<=>)

  chunk DocumentChunk @relation(fields: [chunkId], references: [id], onDelete: Cascade)

  @@map("embeddings")
}
```

### Course

```prisma
model Course {
  id               String   @id @default(uuid()) @db.Uuid
  projectId        String   @map("project_id") @db.Uuid
  roleName         String   @map("role_name")
  title            String
  description      String?
  estimatedMinutes Int?     @map("estimated_minutes")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  modules Module[]

  @@index([projectId])
  @@map("courses")
}

model Module {
  id        String   @id @default(uuid()) @db.Uuid
  courseId  String   @map("course_id") @db.Uuid
  title     String
  position  Int                                       // renamed from orderIndex
  createdAt DateTime @default(now()) @map("created_at")

  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]

  @@index([courseId])
  @@map("modules")
}

model Lesson {
  id        String   @id @default(uuid()) @db.Uuid
  moduleId  String   @map("module_id") @db.Uuid
  title     String
  content   String?
  position  Int
  createdAt DateTime @default(now()) @map("created_at")

  module         Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  checklistItems ChecklistItem[]
  quizzes        Quiz[]
  progress       LessonProgress[]

  @@index([moduleId])
  @@map("lessons")
}

model ChecklistItem {
  id       String @id @default(uuid()) @db.Uuid
  lessonId String @map("lesson_id") @db.Uuid
  text     String
  position Int

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([lessonId])
  @@map("checklist_items")
}

model Quiz {
  id           String  @id @default(uuid()) @db.Uuid
  lessonId     String  @map("lesson_id") @db.Uuid
  question     String
  options      Json
  correctIndex Int     @map("correct_index")
  explanation  String?
  position     Int

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([lessonId])
  @@map("quizzes")
}

model LessonProgress {
  id          String         @id @default(uuid()) @db.Uuid
  lessonId    String         @map("lesson_id") @db.Uuid
  memberId    String         @map("member_id") @db.Uuid
  status      ProgressStatus @default(NOT_STARTED)
  completedAt DateTime?      @map("completed_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  lesson Lesson        @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  member ProjectMember @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([lessonId, memberId])
  @@index([memberId])
  @@map("lesson_progress")
}

enum ProgressStatus { NOT_STARTED IN_PROGRESS COMPLETED  @@map("progress_status") }
```

### Chat

```prisma
model Chat {
  id        String   @id @default(uuid()) @db.Uuid
  projectId String   @map("project_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  project  Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages ChatMessage[]

  @@index([projectId])
  @@index([userId])
  @@map("chats")
}

model ChatMessage {
  id        String   @id @default(uuid()) @db.Uuid
  chatId    String   @map("chat_id") @db.Uuid
  role      ChatRole
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  chat      Chat              @relation(fields: [chatId], references: [id], onDelete: Cascade)
  citations MessageCitation[]

  @@index([chatId])
  @@map("chat_messages")
}

enum ChatRole { USER ASSISTANT  @@map("chat_role") }

model MessageCitation {
  id        String  @id @default(uuid()) @db.Uuid
  messageId String  @map("message_id") @db.Uuid
  chunkId   String? @map("chunk_id") @db.Uuid     // nullable: cite a chunk if known
  label     String                                 // "GitHub: backend/README.md"

  message ChatMessage    @relation(fields: [messageId], references: [id], onDelete: Cascade)
  chunk   DocumentChunk? @relation(fields: [chunkId], references: [id], onDelete: SetNull)

  @@index([messageId])
  @@map("message_citations")
}
```

---

## Code reorganization (ordered task list)

> Run all `npm` commands from `onboardly/`. Lint+build must pass before commit.

### 0. Branch + schema
1. `git checkout development && git pull` → `git checkout -b feature/db-rewrite`.
2. Replace `prisma/schema.prisma` with the schema above.
3. `npm run db:push -- --force-reset` (drops & recreates remote tables). Verify
   `vector` extension present.
4. `npm run db:generate` → regenerates `src/generated/prisma`.

### 1. Identity layer
- **`src/lib/auth/profile.ts`** (consider renaming → `src/lib/auth/identity.ts`):
  rewrite `upsertUserProfile` → `upsertUserIdentity(user)`:
  - Upsert the **`users`** row (`id`, `email`, `displayName` from
    `user_metadata.name||full_name`, `avatarUrl`).
  - If `user_metadata.user_name` present (GitHub login): upsert a
    `user_identities` row `{ provider: GITHUB, externalLogin: login.toLowerCase(),
    externalId: user_metadata.provider_id ?? sub, avatarUrl, isLogin: true }`.
  - Slack login (later): same with `provider: SLACK`. Keep "only overwrite
    non-null" guard so an email re-login doesn't wipe a GitHub identity.
- **`src/app/auth/callback/route.ts`** — call the renamed helper (same
  best-effort try/catch; never block sign-in).

### 2. Access layer — THE KEY CHANGE
- **`src/lib/members/access.ts`** `getProjectAccess(projectId)`:
  - **Delete the org-owner branch** (`project.organization.ownerId === userId`).
  - New logic: `findUnique` project (no `include: organization`); look up the
    caller's `project_members` row via `{ projectId_userId }`; if missing or
    `status !== ACTIVE` → `null`; else `{ project, role }`.
  - `requireProjectAdmin` unchanged (admits `ADMIN`).
  - `getCurrentUserId()` unchanged.
- **`src/types/member.ts`** — `ProjectAccess`/`AccessibleProject` already use
  `ProjectRole`; the regenerated `Project` type drops `organizationId`/repo cols.
  Add a connections shape if the UI needs repo/Slack (see step 7).

### 3. Project layer
- **`src/lib/projects/queries.ts`** — **delete `getCurrentOrganization()`** and
  the `Organization` import. Keep `listProjects`/`getProject` as thin wrappers.
- **`src/lib/members/queries.ts`**:
  - `listAccessibleProjects()` — **remove the owned-org branch entirely**. Now
    just: memberships where `userId = me, status = ACTIVE`, map to
    `{ project, role }`, sort `project.updatedAt desc`. (Creator is included via
    their own ACTIVE ADMIN member row created at project creation.)
  - `listMembers()` — replace the `UserProfile` fallback with a
    `user_identities` (provider=GITHUB) lookup keyed by `userId` for the
    display/avatar fallback. (Snapshot fields on the member row stay primary.)
- **`src/lib/projects/actions.ts`** `createProject`:
  - Drop `getCurrentOrganization`. Get `userId` via `getCurrentUserId()`; 401 if
    none. Ensure a `users` row exists (the login upsert should have created it;
    optionally `upsert` defensively).
  - In a `$transaction`: create `project` with `ownerId: userId`; create the
    creator's `project_members` row (`role: ADMIN, source: MANUAL, status:
    ACTIVE, joinedAt: now`, snapshot identity from the user's GitHub
    `user_identities`); for each non-empty repo/Slack input create a
    `project_connections` row (`provider`, `externalRef`, `status: CONNECTED`,
    `connectedAt: now`).
  - `updateProject`/`deleteProject` — gate stays `requireProjectAdmin`. Move
    repo/Slack edits to upserting `project_connections` rows (don't write project
    columns — they no longer exist).

### 4. Members write layer
- **`src/lib/members/actions.ts`** — `prisma.userProfile` → `prisma.userIdentity`
  (find each user's GitHub identity by `userId` for the snapshot). `addMembers`
  upsert logic unchanged. `countActiveAdmins` counts `role: ADMIN, status:
  ACTIVE` (unchanged). Last-admin guard unchanged.

### 5. GitHub discovery
- **`src/lib/members/candidates.ts`**:
  - `prisma.userProfile.findMany({ githubLogin: { in } })` →
    `prisma.userIdentity.findMany({ where: { provider: GITHUB, externalLogin:
    { in: logins } }, select: { userId, externalLogin, ... }})`. Map by
    `externalLogin`. For display name/email, join the `users` row (include
    `user: { select: { displayName, email } }`).
  - `access.project.githubRepo` → resolve the project's GitHub
    `project_connections.externalRef`.
- **`src/lib/github/installation.ts`** `getStoredInstallationId(projectId)`:
  read the GitHub `project_connections` row (`installationId`). Repo for the
  auto-resolve fallback comes from that row's `externalRef`. `getRepoInstallationId`
  in `client.ts` is unchanged.

### 6. UI pages (mechanical)
- **`src/app/(auth)/projects/[projectId]/page.tsx`** — fetch the project's
  `project_connections` and render GitHub/Slack from them (not
  `project.githubRepo/slackWorkspace`). The access/role logic is unchanged
  (still `getProjectAccess` → `notFound()` on null; admin-gated Edit/Delete).
- **`src/app/(auth)/projects/[projectId]/members/page.tsx`** — the
  `access.project.githubRepo` guard → "does a GitHub `project_connections` row
  exist?" Pass its `externalRef` into the candidate builder path.
- **`src/components/projects/ProjectForm.tsx`** — repo/Slack inputs stay; their
  values now flow into connection rows via the actions. No UI change needed
  unless the type of the prefilled values changes (read from connections in the
  edit page's data fetch).
- `dashboard/page.tsx`, `projects/page.tsx`, `RoleBadge.tsx`,
  `ProjectStatusBadge.tsx` — **no change** (roles unchanged; they already map
  `{ project, role }`).

### 7. Types + mock + cleanup
- **`src/types/project.ts`** — drop `organizationId`, `githubRepo`,
  `slackWorkspace`; add `ownerId`. Add a `ProjectConnection`/`Connections` shape
  if pages pass connections as props.
- **`src/types/integrations.ts`** — re-point to `project_connections` shape.
- **`src/data/mock/projects.ts`** — update to the new `Project` shape.
- Delete/rewrite stale scripts: `scripts/backfill-owner-members.ts` (no longer
  needed — no org backfill), `scripts/verify-members-schema.ts` (rewrite against
  the new schema if you want a verification script).
- Sweep comments mentioning "organization" / "org isolation" → "project
  membership". Notably `src/lib/db/prisma.ts` header comment and
  `src/lib/projects/queries.ts`.

---

## Verification (acceptance for "done")

1. **Schema** — `db push --force-reset` succeeds; `db:generate` clean; `vector`
   extension confirmed on remote (`select extname from pg_extension`).
2. **Build** — `npm run lint` + `npm run build` from `onboardly/` → 0 errors.
3. **Data layer (scripts, like Phase 2):**
   - Seed: insert a `users` row + GitHub `user_identities`; create a project
     (creator becomes an ACTIVE ADMIN member, `projects.ownerId = creator`).
   - Add a second user as MEMBER.
   - `listAccessibleProjects` returns the project for **both** users, **not** for
     a third (stranger). `getProjectAccess(stranger)` → null.
   - Last-admin guard: cannot remove/demote the only ADMIN.
   - Soft-delete: remove a member → `status REMOVED`, filtered from roster;
     re-add reactivates the row (progress preserved).
4. **Discovery end-to-end** — connect `htuco/htuco` (create a GitHub
   `project_connections` row); resolve installation id; list collaborators;
   confirm `altmahrum-web` is **addable** (re-run the discovery test against
   `user_identities`).
5. **Browser — members acceptance checklist** (from
   `context/features/project-members-and-admin.md` §Testing 1–8):
   create project → creator on roster → Add members (real collaborators,
   addable/greyed/self) → add → "Already added" → **cross-org member view**
   (member sees only that project, read-only, no Edit/Delete/Connect/Add) →
   **isolation** (stranger → notFound) → **role guard** (member hitting
   mutations rejected; last admin protected) → **progress** ("Not started", no
   divide-by-zero) → **responsive** 390 / 768 / 1440.

---

## Gotchas (carry over from the members build)

- **GitHub login is the join key, lowercased** everywhere (`externalLogin`,
  collaborator match, snapshot).
- **Role enforcement is app-side** — Prisma bypasses Supabase RLS. Every mutation
  re-checks `requireProjectAdmin`; every read goes through `getProjectAccess`.
  Hiding a button is not security.
- **Filter `REMOVED` everywhere** — roster, access check (only `ACTIVE` counts),
  `listAccessibleProjects`, and the candidate "already a member" annotation (a
  REMOVED collaborator must appear **addable** again).
- **`addMembers` must upsert**, not `createMany` — a previously-REMOVED member
  already has a row; `createMany` throws on `@@unique([projectId, userId])`.
- **Progress is derived** — never persist a percent; 0 lessons / no course ⇒
  "Not started". Never divide by zero. % = COMPLETED `lesson_progress` /
  total lessons in the member's project (recompute denominator from current
  lessons; ignore orphaned progress rows).
- **`provider_token` is short-lived** and **not** used for discovery — discovery
  uses the **App installation token** (persistent). Don't depend on
  `gh_provider_token` for the members flow.
- **Dev server / Turbopack cache** — after a schema regen, if you hit
  `Cannot read properties of undefined (reading 'findMany')`, the dev server is
  stale: kill it, `rm -rf .next`, restart. (Hit this during the members build.)
- **Verification scripts** — run with
  `npx tsx --env-file=.env.local --tsconfig tsconfig.json scripts/<x>.ts`; wrap
  logic in `main()` (top-level await fails in cjs); the `@/` alias only resolves
  from the project dir.

---

## What is already done (on `feature/project-members-and-admin`, being pushed)

The full members feature is implemented and browser-tested **against the OLD
schema** (orgs + `UserProfile` + `integrations`). You are re-pointing it at the
new schema. Files that already exist and just need the schema swap, not a
rewrite of their logic:

- `src/lib/members/{access,queries,actions,candidates}.ts`
- `src/lib/github/{collaborators,installation}.ts`, `getRepoInstallationId` in
  `client.ts`
- `src/lib/auth/profile.ts`, `src/app/auth/callback/route.ts`
- `src/components/members/*`, `src/components/ui/{dialog,checkbox,avatar}.tsx`
- `src/app/(auth)/projects/[projectId]/members/page.tsx`, overview/edit/course/
  chat/admin pages, dashboard + projects list
- `src/types/member.ts`

Their **behavior is the target**; only the data access (org branch →
membership-only, `UserProfile` → `user_identities`, project columns →
`project_connections`) changes.

---

## References

- `context/features/project-members-and-admin.md` — members spec + acceptance.
- `context/roadmap.md` — authoritative 13-phase plan (schema must serve all).
- `context/coding-standards.md` — TS strict/no-any, responsive (390/768/1440),
  tokens-only UI, data logic in `src/lib`, app-side tenant isolation.
- `context/ai-interaction.md` — feature workflow + commit rules.
- Plan file (this session): `~/.claude/plans/peppy-nibbling-deer.md`.
