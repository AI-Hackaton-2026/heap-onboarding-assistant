// Placeholder API route for future Slack sync.
// Future responsibility:
//   Fetch channels → fetch messages and threads → summarize discussions
//   → store Slack knowledge summaries.

export async function POST() {
  return Response.json({ message: "Slack sync placeholder" });
}
