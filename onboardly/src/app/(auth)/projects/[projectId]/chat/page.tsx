// RAG chat placeholder — shows mock messages and a disabled composer.
// Wiring to /api/chat + retrieval happens in a later phase.

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockChatMessages } from "@/data/mock/chat";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await params;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="font-heading text-2xl font-semibold">Chat</h1>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {mockChatMessages.map((message) => (
          <div
            key={message.id}
            className="bg-muted max-w-prose rounded-lg px-3 py-2 text-sm"
          >
            {message.content}
          </div>
        ))}
      </div>
      <form className="mt-4 flex gap-2">
        <Input placeholder="Ask about your project…" disabled />
        <Button type="submit" disabled>
          Send
        </Button>
      </form>
    </div>
  );
}
