# Onboardly — Team Tasks (Remaining Work)

> Work split by **feature area** across the 5-person team. Authoritative phase
> definitions live in `context/roadmap.md`; this file assigns ownership and
> tracks status. Each owner drives their vertical slice end-to-end (data layer →
> API → UI), following the feature workflow in `context/ai-interaction.md` and
> the git flow in `context/git-workflow.md`.

## Status legend

`TODO` · `IN PROGRESS` · `BLOCKED` · `IN REVIEW` · `DONE`

## Global requirements (apply to every task)

- **Responsive by default** — every component/page must work on mobile, tablet, and desktop; verify at 390 / 768 / 1440. See `context/coding-standards.md` → "Responsiveness".
- TypeScript strict, no `any`; data logic in `src/lib`, writes via server actions / route handlers; Prisma bypasses RLS → **enforce tenant isolation in app logic** (scope every query by the current org). See `context/coding-standards.md`.
- shadcn/ui + Tailwind v4 semantic tokens only (no hardcoded colors) — keep the new purple theme tokens; light/dark must both work.
- `npm run lint` + `npm run build` must pass before commit; browser-test the happy path.

---

## ✅ Already done (context)

- **Phase 1 — Setup, DB (Prisma + Supabase), Auth** — DONE
- **Phase 2 — Core Project Management** (Org auto-create + Project CRUD, real DB, tenant isolation) — DONE (this branch)
- **Phase 3 (start) — GitHub login + repo listing + ingestion-ready flag** — DONE
- **Theming (purple) + app icon** — DONE

> **Owners are unassigned** — areas are grouped by feature vertical; assign people per area as you see fit. (Arnes already has WIP on Documentation/Embeddings — have him push & align with the task ids.)

---

## GitHub ingestion (finish Phase 3)

GitHub vertical from connection through analysis. Builds on the existing OAuth login + listing + App-auth helpers (`src/lib/github/client.ts`).

- [ ] **`T-GH-1` Repo connection flow** — `TODO` — From `/integrations/github`, connect a repo to a **project** (project picker, Option A) via the GitHub App: install → capture `installation_id` → save to `integrations` row (`type=GITHUB`, `config` JSON), verify access with an installation token. Depends on Phase 2 (DONE).
- [ ] **`T-GH-2` Repo sync** — `TODO` — Fetch repo metadata / folder tree / files; ignore `node_modules`, `build`, `dist`, `coverage`, generated files. Store as `documents`. (`src/lib/github/sync.ts`, `api/github/sync`.)
- [ ] **`T-GH-3` Repo analysis** — `TODO` — Repository Map, Folder Summaries, Architecture Summary; persist as repo-summary documents (feeds embeddings). Knowledge-graph nodes are stretch (coordinate with Knowledge owner).

## Documentation upload + Embeddings/Search (Phases 4 + 6) *(Arnes has WIP here)*

Getting raw knowledge in and making it searchable. **Note: Arnes's in-flight work isn't on `origin/development` yet — it should be pushed and aligned with these task ids to avoid duplication.**

- [ ] **`T-DOC-1` Storage + upload** — `TODO` — Supabase Storage buckets (`docs`, `uploads`); upload UI + route for PDF / Markdown / DOCX / TXT (scoped to a project).
- [ ] **`T-DOC-2` Parse + chunk** — `TODO` — Extract raw text, store original + parsed content as `documents`; split into chunks. (`src/lib/documents/*`, `api/documents/upload`.)
- [ ] **`T-EMB-1` Embedding pipeline** — `TODO` — Per chunk → Gemini embedding → store in pgvector (`embeddings`, `vector(768)`). Cover docs, repo summaries, Slack summaries. (`src/lib/ai/gemini.ts`, `src/lib/rag/*`.)
- [ ] **`T-EMB-2` Retrieval layer** — `TODO` — Similarity search via raw SQL (`<=>`) returning top-k chunks **with source labels** for citations. Powers Knowledge + Chat.

## Slack integration + Ownership/Messaging (Phases 5 + 11 + 12)

The Slack vertical and the "who do I ask?" people features (depend on GitHub + Slack data).

- [ ] **`T-SLACK-1` Slack app + connect** — `TODO` — Slack App (scopes `channels:read/history`, `groups:read/history`, `users:read`); OAuth connect, save workspace to `integrations` (`type=SLACK`).
- [ ] **`T-SLACK-2` Slack sync + summaries** — `TODO` — Sync channels/messages/threads; topic/feature summaries + team-ownership hints stored as documents. (`src/lib/slack/*`, `api/slack/sync`.)
- [ ] **`T-OWN-1` Ownership detection** — `TODO` — Analyze commits/PRs/discussions → feature owners + active contributors ("Auth is maintained by Alice, Bob"). Depends on GitHub + Slack sync.
- [ ] **`T-MSG-1` AI message generation** — `TODO` — Draft a professional intro/question message to the right owner, with citations. Depends on `T-OWN-1`.

## Course generator + Course UI (Phases 8 + 9)

The course vertical end-to-end. Depends on the knowledge base, but UI + structure can start against mock knowledge.

- [ ] **`T-COURSE-1` Course generator** — `TODO` — Free-text role → Gemini-generated course: modules, lessons, checklists, quizzes, estimated duration. Persist `courses → modules → lessons → checklist_items → quizzes`. (`src/lib/course/*`, `api/course/generate`.)
- [ ] **`T-COURSE-2` Editable content** — `TODO` — Admin edits lessons, reorders modules, adds/removes content.
- [ ] **`T-COURSE-3` Course UI (Anthropic-Academy style)** — `TODO` — Sidebar (modules + progress), lesson page (content, checklist, quiz). **Fully responsive.**
- [ ] **`T-COURSE-4` Progress tracking** — `TODO` — Completed lessons / modules / quiz completion; lift shared progress state to a provider.

## Knowledge base + RAG Chat + Admin dashboard (Phases 7 + 10 + 13)

The unified knowledge model, the cited chat assistant, and the admin controls.

- [ ] **`T-KB-1` Unified knowledge + citations** — `TODO` — Systems / Components / Relationships model; citation system tracking source (file path / document / Slack channel) for every chunk. Consumes the retrieval layer (`T-EMB-2`).
- [ ] **`T-CHAT-1` RAG chat pipeline** — `TODO` — Question → retrieve chunks → build context → Gemini → answer **with citations**; must say "I couldn't find this in company documents" instead of hallucinating. (`api/chat`, `src/lib/rag/*`.)
- [ ] **`T-CHAT-2` Chat UI** — `TODO` — Chat page with streamed answers + `[Source: ...]` chips; guided next-step suggestions. **Fully responsive.**
- [ ] **`T-ADMIN-1` Admin dashboard** — `TODO` — Knowledge-base status (GitHub sync, Slack sync, embedding, course gen) + Resync GitHub / Resync Slack / Regenerate Course / Rebuild Knowledge Base controls. **Also surfaces the members + onboarding-% overview** (see `T-MEM-*`).

---

## ⭐ Project Members & Admin (new — spec: `context/features/project-members-and-admin.md`)

The membership + project-roles spine the product is missing today (no member, no per-person onboarding %, no project roles, single-org-only visibility). Pull this **forward** — course progress and ownership both depend on it. Spans owners; coordinate.

> **Approach locked with the user (supersedes the older email/contributors/invite design):** discovery via the GitHub **collaborators** API (catches new hires with 0 commits); identity linked by **GitHub login (lowercased), email fallback**; members **must already have an Onboardly account** (no invite/pre-signup flow this slice); collaborators without an account show **greyed-out "No Onboardly account"**; "projects I can see" becomes the **union of owned ∪ member-of** (cross-org). Full rationale + decision table in the spec.

- [ ] **`T-MEM-1` Membership + profile + progress schema** — `TODO` — Add `UserProfile` (GitHub-login directory), `ProjectMember`, `LessonProgress` and enums `ProjectRole` / `MemberSource` / `MemberStatus` / `ProgressStatus`; `prisma db push`. Creator auto-added as ADMIN member (+ back-fill existing project owners). Populate `UserProfile` on GitHub login from Supabase `user_metadata`. **Unblocks T-MEM-2..4 + the cross-org view.**
- [ ] **`T-MEM-2` Members data layer + roles + cross-org view** — `TODO` — `src/lib/members/{access,queries,actions}.ts`: `getProjectAccess` / `requireProjectAdmin`, list members, add/remove, set role; **derive onboarding %** (`completed / total lessons`, stub-safe → "Not started" until courses exist). Switch `listProjects` to the **owned ∪ member-of union**; route reads through the access guard. Enforce ADMIN-vs-MEMBER in app logic (Prisma bypasses RLS).
- [ ] **`T-MEM-3` Discover candidates (GitHub collaborators)** — `TODO` — `GET /repos/{owner}/{repo}/collaborators` (installation token) in `src/lib/github/collaborators.ts`; intersect with `UserProfile` by **lowercased GitHub login** in `src/lib/members/candidates.ts` → annotate addable / already-member / no-account. (Slack + manual-by-email tabs stubbed this slice.)
- [ ] **`T-MEM-4` Members UI (roster + add dialog)** — `TODO` — `/projects/[projectId]/members`: roster with avatar/name/login/role/% bar/status + Remove; admin "Add members" dialog (GitHub-collaborators tab live; Slack/manual stubbed). Member view is **read-only**. Entry point on overview + admin dashboard. **Fully responsive (390/768/1440).**
- [ ] **`T-MEM-5` (deferred) Invite + signup linking** — `TODO` — Supabase Auth invite email for not-yet-signed-up people; on first sign-in match by login/email → set `userId`, flip to ACTIVE. **Out of scope for the current slice** (members must already exist); enums keep `INVITED`/`MANUAL`/`SLACK` for forward-compat.
- [ ] **`T-MEM-6` Progress writes from Course UI** — `TODO` — Lesson complete / checklist / quiz attempts write `LessonProgress` for the current member; feeds the roster %. Integrates with `T-COURSE-4` (lands with the Course UI).

> Admin dashboard (`T-ADMIN-1`) renders the members + progress overview alongside integration/sync status.

## Cross-cutting / shared (pick up as capacity allows)

- [ ] **`T-X-1` Knowledge Graph (STRETCH)** — `TODO` — Systems/components/relationships from repo + docs (builds on `T-GH-3` nodes + `T-KB-1`).
- [ ] **`T-X-2` Org management UI** — `TODO` — Phase 2 shipped org **auto-create**; a real org settings/switcher UI is still open if multi-org is needed.
- [ ] **`T-X-3` Responsive audit pass** — `TODO` — Sweep all existing pages at 390 / 768 / 1440 and fix gaps (now a hard standard).

## Dependency notes

- Embeddings/Search (`T-EMB-*`) gate Knowledge (`T-KB-1`), Chat (`T-CHAT-*`), and Course generation quality.
- Ownership/Messaging (`T-OWN-1`, `T-MSG-1`) need both GitHub and Slack sync landed.
- **Schema (`T-MEM-1`: `UserProfile` + `ProjectMember` + `LessonProgress`) gates the rest of `T-MEM-*`, the cross-org view (`T-MEM-2`), and the admin roster (`T-ADMIN-1`); progress writes (`T-MEM-6`) depend on the Course UI (`T-COURSE-*`).** Pull `T-MEM-1` forward.
- Member discovery (`T-MEM-3`) needs the project's GitHub repo connected + the App installed (collaborators read via installation token); discoverable Onboardly users need a `UserProfile` (populated on GitHub login). Slack import + invite/signup-linking (`T-MEM-5`) are deferred.
- All ingestion + members attach to a **project** → Phase 2 (DONE) is the prerequisite that unblocks everyone.
