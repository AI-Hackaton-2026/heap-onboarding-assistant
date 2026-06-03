// Slack sync entry point. Currently delegates to the mock pipeline.
// Replace syncSlackMock with real Slack API calls when T-SLACK-1 is implemented.

export { syncSlackMock as syncSlack, getSlackSyncStatus } from "@/lib/slack/mock";
