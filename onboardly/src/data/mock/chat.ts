// Mock chat messages for building the chat UI before the RAG pipeline exists.

import type { ChatMessage } from "@/types/chat";

export const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    content:
      "Hi! Ask me anything about your onboarding plan or project knowledge base.",
  },
];
