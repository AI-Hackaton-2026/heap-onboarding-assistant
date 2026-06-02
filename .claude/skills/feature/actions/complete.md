# Complete Action

1. Stage all changes and commit with a descriptive message
2. Switch to development and merge the feature branch (no push yet)
3. Delete the local feature branch
4. Reset current-feature.md:
   - Change H1 back to `# Current Feature`
   - Clear Goals and Notes sections (keep placeholder comments)
   - Add feature summary to the END of History
5. Commit the reset: `chore: reset current-feature.md after completing [feature]`
6. Push development to origin ONCE (single push with all changes)
7. If feature branch was previously pushed, delete it from origin

> Note: `main` is the release branch. Feature branches merge into `development`; `development` is merged into `main` only at the end (separate release step). Never merge a feature branch directly into `main`.