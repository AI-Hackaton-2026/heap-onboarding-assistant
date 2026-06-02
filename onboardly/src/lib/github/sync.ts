// Placeholder GitHub sync pipeline.
// Future responsibility:
//   Fetch repo tree → filter relevant files (ignore node_modules/build/dist/coverage)
//   → generate repo map + folder summaries → store documents and summaries.

import type { Project } from "@/types/project";

export async function syncGitHubRepo(_project: Project): Promise<void> {
  throw new Error("GitHub sync not implemented yet");
}
