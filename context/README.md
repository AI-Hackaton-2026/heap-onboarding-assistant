# context/

Project context that Claude reads at the start of every session. `CLAUDE.md` (in the project root) `@`-imports these files, so keeping them accurate is how Claude stays grounded.

## Files

| File | Purpose | Fill in? |
| ---- | ------- | -------- |
| `project-overview.md` | What the project is — problem, users, features, stack, data model, roadmap. | ✅ Per project |
| `coding-standards.md` | How code should be written — language rules, framework conventions, file org, naming. | ✅ Per project |
| `ai-interaction.md` | How Claude should work with you — communication, the feature workflow, commit rules. | ⚙️ Mostly generic; set `{{BUILD_COMMAND}}` |
| `current-feature.md` | The single active feature (Status / Goals / Notes / History). Driven by the `/feature` skill. | ▶️ Ships blank |
| `features/` | One spec per planned feature/fix. See `features/README.md`. | ➕ Add as you go |

## Optional folders (create when you need them)

- `research/` — output target for the `/research` skill (investigation docs, no code changes).
- `fixes/` — bug specs, same shape as `features/` (the `/feature load` skill checks both folders).
- `screenshots/` — UI references you point specs at.

## Filling in templates

Files ending in `.template` have `{{PLACEHOLDER}}` tokens. After importing the kit, drop the `.template` extension and replace every `{{...}}`. Either do it by hand or say **"fill in the context files"** and Claude will interview you and complete them.
