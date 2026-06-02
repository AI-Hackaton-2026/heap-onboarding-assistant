// Placeholder API route for future RAG chat.
// Future responsibility:
//   Receive user question → retrieve relevant chunks → send context + question
//   to Gemini → return answer with citations.

export async function POST() {
  return Response.json({ message: "Chat placeholder" });
}
