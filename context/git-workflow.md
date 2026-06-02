# Git / GitHub Workflow For Claude

This document defines the required Git and GitHub workflow for the Heap project.

Claude must follow this workflow whenever a task is completed and the code is ready to be committed.

---

## 1. General Rule

When a task is finished, do **not** immediately commit everything.

Before committing, Claude must:

1. Pull the latest `development` branch from origin.
2. Review all changed files (`git status`, `git diff`).
3. Split the work into small logical parts.
4. Write each commit message in **Title Case** (every leading word capitalized except connectives like `And`, `For`, `In`, `To`, `Of`, `On`, `With`, `The`, `A`, `An`).
5. Do **not** include `Co-Authored-By` trailers — **never** add `Co-Authored-By: Claude` or any "Generated with Claude" / AI-authorship line. Commits must read like a human wrote them.
6. After committing locally, **push the feature branch** to remote (only the feature branch — **never** `development` or `main`). Push is part of the flow; ask once before pushing, then push on confirmation.
7. After pushing, hand the user a ready-to-use **PR description** (English, repo template) so they can open the PR, add screenshots, etc.

---

## 1A. Feature Lifecycle (Authoritative End-To-End Flow)

This is the required order of operations for every feature, aligned with the `/feature` skill. Follow it exactly.

1. **Load context** (user says "load context"): before `/feature load`, **pull remote `development` into local `development`** so we see what colleagues have merged.
   ```bash
   git fetch origin
   git checkout development
   git pull origin development
   ```
2. **`/feature load`** — capture the spec in `context/current-feature.md`.
3. **`/feature start`** — create the feature branch **off the freshly pulled `development`**, then pull `development` into it so the branch is **identical to remote `development`** and tracks nothing extra:
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/<thing>
   git pull origin development          # ensure the branch is identical to remote development, no stray tracking
   ```
4. **Implement** — build per `current-feature.md`, preserving existing patterns.
5. **`/feature complete`** — when the work is done:
   - **Commit in small logical chunks**, Title Case, **no `Co-Authored-By`**, structured so the history reads like normal human work (not one AI mega-commit).
   - **Push the feature branch to remote** (feature branch only, never `development`). Ask once, then push.
   - **Provide the PR description** (English, repo template) for the user to open the PR manually and attach screenshots.
6. Update the relevant `.md` files (`current-feature.md` → History, `last-feature.md`) as instructed.

---

## 2. Sync With The Development Branch

Before creating any commit, always make sure the local branch is up to date with the latest `development` branch from origin.

Run:

```bash
git fetch origin
git checkout development
git pull origin development
```

If the work was done on another branch, update that branch with the latest `development`.

Example:

```bash
git checkout feature-branch-name
git merge development
```

Or, if the project prefers rebase:

```bash
git checkout feature-branch-name
git rebase development
```

Use the existing project workflow. Do not introduce a different branching strategy unless explicitly asked.

---

## 3. Handle Conflicts Before Committing

If pulling, merging, or rebasing `development` creates conflicts:

1. Stop and inspect the conflicts.
2. Resolve them carefully.
3. Make sure no existing work is accidentally removed.
4. Run the project checks again.
5. Continue only when conflicts are fully resolved.

Do not create commits while merge conflicts are unresolved.

Check status with:

```bash
git status
```

---

## 4. Commit Message Format

Every commit message must be in **Title Case**.

### Structure

```text
<Title Case subject — imperative, ≤ 72 chars, no trailing period>

<optional body: what & why, wrapped at ~72 cols; bullets allowed>
```

- **Subject:** Title Case, imperative mood (`Add…`, `Fix…`, `Refactor…`, not `Added`/`Adds`), ≤ 72 characters, **no trailing period**.
- **No type prefixes.** Do **not** use Conventional-Commit prefixes (`feat:`, `fix:`, `chore:`). The subject describes the change directly.
- **Body (optional):** add one when the *why* isn't obvious from the subject. Separate it from the subject with one blank line.
- **No `Co-Authored-By`** trailers and no "Generated with Claude" / AI-authorship lines (see §1 and §13).

Title Case rule: capitalize the first letter of every word **except** short connectives (`and`, `for`, `in`, `to`, `of`, `on`, `with`, `the`, `a`, `an`). The very first word is always capitalized.

Good examples:

```text
Add Card Status Transitions To Wallet API
Reuse Existing Reaction Picker For Comments
Fix Refund Flow For Pending Transactions
Improve Dashboard Empty State In Dark Mode
Align Modal Open Animation With Design Tokens
```

Do **not** use lowercase sentence-style messages:

```text
add card status transitions
fix bug
update stuff
```

Do **not** use vague commit messages:

```text
fix
changes
final
update stuff
WIP
```

---

## 5. Commit In Small Logical Parts

Do not commit all changes at once.

Each commit should represent one clear and reviewable part of the work.

Good examples:

```text
Add Backend Support For Money Requests
Add Money Request UI Flow
Wire Money Request Notifications Into Dashboard
Fix Available Balance Calculation For Pending Outgoing
```

Bad example:

```text
Implement Money Requests And Fix Balance And Update UI
```

Small commits make it easier to review the work and find regressions.

---

## 6. Review Changes Before Staging

Before staging files, always inspect the current changes.

Run:

```bash
git status
git diff
```

If needed, inspect specific files:

```bash
git diff path/to/file
```

Do not stage unrelated changes.

---

## 7. Stage Files Carefully

Stage only the files that belong to the current logical commit.

Preferred:

```bash
git add server/services/transaction/settle.py
git add server/schemas/transaction.py
git commit -m "Apply Balance Change On Settle Instead Of On Create"
```

Avoid `git add .` unless every changed file belongs to the same logical commit and there are no unrelated changes.

---

## 8. Suggested Commit Splitting

When work includes backend, frontend, migration, and styling changes, split the commits like this:

### Backend / API

```text
Add API Support For Feature Name
```

### Database / Alembic

```text
Add Migration For Feature Name
```

### Frontend Logic

```text
Add Frontend Behavior For Feature Name
```

### UI Components

```text
Add UI Components For Feature Name
```

### Styling / Polish

```text
Improve Styling For Feature Name
```

### Bug Fix

```text
Fix Specific Bug Description
```

Do not mix unrelated backend, frontend, and UI polish changes unless they are very small and tightly connected.

---

## 9. Run Checks Before Finalizing

Before considering the work ready, run the project checks.

Typical commands:

```bash
# from client/
npm run lint
npm run build

# from server/
uv run pytest
```

If any command fails:

1. Fix the issue.
2. Run the command again.
3. Do not commit broken code unless the user explicitly asks for a checkpoint commit.

---

## 10. Push The Feature Branch (Never `development` Or `main`)

After committing locally, Claude pushes the **feature branch** to origin as part of the flow.

Rules:

- Ask **once** before pushing, then push on confirmation. Pushing the feature branch is the expected default, not an exception.
- Push the **feature branch only** — **never** push to `development` or `main` directly.

```bash
git push -u origin feature/<thing>
```

After pushing, hand the user a ready-to-use PR description (see Section 11) so they open the PR and add screenshots themselves. Claude does not open the PR via `gh pr create` unless explicitly asked.

---

## 11. Pull Request

Once commits are ready (and pushed by the user), the next step is to open a Pull Request from the feature branch into `development`. (`main` is the release branch — `development` is merged into `main` only at the end, via a separate release PR.)

Claude should propose a PR title and description and let the user create the PR (do not open the PR via `gh pr create` unless the user explicitly asks).

### PR Language

PR titles and descriptions are written in **English** — never Bosnian.

### PR Title Format

```text
Short Title In Title Case
```

Keep it under ~80 characters. It should describe the outcome, not list every file touched.

### PR Description

Use the structure from `.github/pull_request_template.md`:

```markdown
### 🔍 Description

<one or two sentences>

### ✅ What has been done

- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Added tests
- [ ] Updated documentation

### 🧪 How to test

<clear steps to test locally>

### ⚠️ Database Changes

- [ ] Migrations are required
- [ ] No migrations needed

<filename or purpose if migrations are required>

### 📸 Screenshots (if applicable)

### 📋 Checklist

- [ ] Code has been tested locally
- [ ] Linter/formatter passed
- [ ] The PR is linked to a related issue (if applicable)

Closes #[ISSUE_NUMBER]
```

Keep it focused on what a reviewer needs to know. Don't dump the full commit log into the description — reviewers can read the commit list on the PR page.

### Bad PR title examples

```text
Updates
Fixes
Final changes
WIP
```

### Good PR title examples

```text
Add Money Request Flow End To End
Improve Available Balance Calculation For Pending Outgoing
Refactor Transaction Settle Path Into Service Layer
```

---

## 12. Final Response After Committing

After commits are created and the feature branch is pushed, Claude should summarize:

- How many commits were created
- What each commit contains
- Whether lint / build / tests passed
- That the feature branch was pushed to remote (and `development` / `main` were not touched)
- The PR description for the user to open the PR

When handing the user a PR description, output it as ONE fenced markdown code block (the whole template inside a single ```markdown fence), so it can be copied with the code block's copy button.

**Why:** The user copies the PR body via the one-click copy button on the code block; prose with inline `###` headings outside a fence can't be grabbed in one action.

**How to apply:** Put the entire repo PR template (Description, What has been done, How to test, Database Changes, Screenshots, Checklist, Closes #) inside a single ```markdown ... ``` fence. Don't split it across multiple blocks or leave parts as plain text.


Example:

```text
Done.

Created 3 commits:

1. Add Backend Support For Money Requests
2. Add Money Request UI Flow
3. Wire Money Request Notifications Into Dashboard

Checks:
- npm run lint passed
- npm run build passed
- uv run pytest passed

Pushed feature/money-requests to origin. development/main untouched.
PR description below 👇
```

---

## 13. Important Rules

- Before loading a feature, pull remote `development` into local `development` to see colleagues' merged work.
- On feature start, branch off the freshly pulled `development` and pull `development` into the branch so it is identical to remote `development`.
- Always write commit messages in Title Case.
- Always commit in small logical chunks that read like normal human work — never one giant AI-style commit.
- Always review changed files before staging.
- Never commit unrelated files.
- **Never** include `Co-Authored-By` trailers or any "Generated with Claude" / AI-authorship line.
- After committing, push the **feature branch** to remote (ask once first). **Never** push to `development` or `main`.
- Always hand the user a PR description after pushing; let them open the PR and add screenshots.
- Never write PRs in Bosnian — always English.
- Never hide failed lint / build / test results.
- Keep commits easy to review.

---

## 14. Quick Checklist

Before committing:

- [ ] Pulled latest `development` from origin
- [ ] Reviewed `git status`
- [ ] Reviewed `git diff`
- [ ] Split work into logical commit chunks
- [ ] Staged only related files
- [ ] Commit message is in Title Case
- [ ] No `Co-Authored-By` trailer
- [ ] Ran lint / build / tests

After committing:

- [ ] Pushed the feature branch to remote (asked once first)
- [ ] Did **not** push to `development` or `main`
- [ ] Handed the user a PR description

---

## Final Workflow Summary

When the task is complete:

```text
Load context
→ Pull remote development into local development (see colleagues' work)
→ /feature load (capture spec)
→ /feature start → branch off development, pull development into branch (identical to remote development)
→ Implement
→ /feature complete:
   → Review git status and git diff
   → Stage related files only
   → Commit in small logical chunks (Title Case, no Co-Authored-By, human-looking history)
   → Run lint / build / tests
   → Push the FEATURE branch to remote (ask once; never push development or main)
   → Hand the user a PR description (English, repo template) for them to open the PR + add screenshots
→ Update current-feature.md / last-feature.md as instructed
```
</content>
</invoke>