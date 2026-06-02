"use client";

import { useState, useRef, useEffect, use } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Citation } from "@/types/chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isError?: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const isMockProject = !UUID_RE.test(projectId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, projectId, chatId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: err.error ?? "Something went wrong. Please try again.",
            isError: true,
          },
        ]);
        return;
      }

      const data = await res.json();
      if (data.chatId && !chatId) setChatId(data.chatId);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          citations: data.citations?.length > 0 ? data.citations : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="font-heading text-2xl font-semibold">Chat</h1>

      {/* Message list */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
        {isMockProject ? (
          <p className="text-muted-foreground text-sm">
            This is a demo project. Create a real project to use the chat
            feature.
          </p>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Ask a question about your project — answers are grounded in your
            connected knowledge base.
          </p>
        ) : null}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "ml-auto max-w-prose"
                : "max-w-prose"
            }
          >
            <div
              className={[
                "rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.isError
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted",
              ].join(" ")}
            >
              {msg.content}
            </div>

            {/* Citation badges */}
            {msg.citations && msg.citations.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {msg.citations.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {c.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="max-w-prose">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm">
              <span className="animate-pulse">•••</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <Input
          placeholder={isMockProject ? "Create a real project to chat…" : "Ask about your project…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || isMockProject}
          autoFocus
        />
        <Button type="submit" disabled={loading || isMockProject || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
