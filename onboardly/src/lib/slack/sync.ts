// Placeholder Slack sync pipeline.
// Future responsibility:
//   Fetch channels → fetch messages and threads → summarize discussions
//   (topics, feature discussions, ownership hints) → store Slack summaries.

import type { Project } from "@/types/project";

export async function syncSlackWorkspace(_project: Project): Promise<void> {
  throw new Error("Slack sync not implemented yet");
}
