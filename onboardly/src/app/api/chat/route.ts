// RAG chat API route.
//
// POST /api/chat
//   body: { message: string, projectId: string, chatId?: string }
//   returns: { answer: string, citations: Citation[], chatId: string }
//
// Flow:
//   1. Authenticate via Supabase session
//   2. Embed the question
//   3. pgvector similarity search scoped to projectId (top-5 chunks)
//   4. Fetch last 10 messages from DB for conversation history
//   5. Build a Gemini generateContent request with system prompt + context + history
//   6. Persist both turns (USER + ASSISTANT) in a single Prisma transaction
//   7. Return answer + citations + chatId

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getGemini, GEMINI_CHAT_MODEL } from "@/lib/ai/gemini";
import { getProjectAccess } from "@/lib/members/access";
import { searchKnowledge } from "@/lib/rag/search";
import type { Citation } from "@/types/chat";

interface ChatRequestBody {
  message: string;
  projectId: string;
  chatId?: string;
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, projectId, chatId } = body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!projectId || typeof projectId !== "string" || !UUID_RE.test(projectId)) {
    return Response.json(
      { error: "projectId must be a valid UUID" },
      { status: 400 },
    );
  }
  if (
    chatId !== undefined &&
    (typeof chatId !== "string" || !UUID_RE.test(chatId))
  ) {
    return Response.json(
      { error: "chatId must be a valid UUID" },
      { status: 400 },
    );
  }

  if (!(await getProjectAccess(projectId))) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // 3. Resolve or create the current user's chat session
  let resolvedChatId = chatId;
  if (resolvedChatId) {
    const chat = await prisma.chat.findFirst({
      where: { id: resolvedChatId, projectId, userId: user.id },
      select: { id: true },
    });
    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }
  } else {
    const chat = await prisma.chat.create({
      data: {
        projectId,
        userId: user.id,
        title: message.slice(0, 80),
      },
    });
    resolvedChatId = chat.id;
  }

  // 4. Fetch last 10 messages for history (oldest first)
  const history = await prisma.chatMessage.findMany({
    where: { chatId: resolvedChatId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  history.reverse();

  // 5. Retrieve relevant knowledge chunks (empty array = knowledge base not yet indexed)
  let chunks: Awaited<ReturnType<typeof searchKnowledge>> = [];
  try {
    chunks = await searchKnowledge(message, projectId);
  } catch {
    // If embedding/search fails (e.g. no embeddings table rows), proceed with empty context
  }

  // 6. Build context block for the prompt
  const contextBlock =
    chunks.length > 0
      ? chunks
          .map((c, i) => `[${i + 1}] ${c.sourceLabel}\n${c.content}`)
          .join("\n\n")
      : null;

  const systemPrompt = contextBlock
    ? `You are Onboardly, an AI onboarding assistant. Answer the user's question using ONLY the provided company knowledge excerpts below. Always cite the source number(s) you used at the end of your answer in the format [1], [2], etc.\n\nKnowledge base:\n${contextBlock}`
    : `You are Onboardly, an AI onboarding assistant. The knowledge base for this project has not been indexed yet — no documents, GitHub content, or Slack messages have been synced. Let the user know this and suggest they connect integrations or upload documents first.`;

  // 7. Build Gemini contents array from history + new message
  // DB ChatRole is USER/ASSISTANT (uppercase); Gemini uses "user"/"model"
  const contentsFromHistory = history.map((msg) => ({
    role: msg.role === "USER" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const ai = getGemini();
  const geminiResponse = await ai.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents: [
      ...contentsFromHistory,
      { role: "user", parts: [{ text: message }] },
    ],
    config: {
      systemInstruction: systemPrompt,
    },
  });

  const answer =
    geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text ??
    "I was unable to generate a response. Please try again.";

  // 8. Build citations from the chunks that were used
  const citations: Citation[] = chunks.map((c) => ({
    label: c.sourceLabel,
    source: c.sourceLabel,
  }));

  // 9. Persist both turns in a single transaction
  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        chatId: resolvedChatId,
        role: "USER",
        content: message,
      },
    }),
    prisma.chatMessage.create({
      data: {
        chatId: resolvedChatId,
        role: "ASSISTANT",
        content: answer,
        citations:
          chunks.length > 0
            ? {
                create: chunks.map((chunk) => ({
                  chunkId: chunk.id,
                  label: chunk.sourceLabel,
                })),
              }
            : undefined,
      },
    }),
  ]);

  return Response.json({
    answer,
    citations,
    chatId: resolvedChatId,
  });
}
