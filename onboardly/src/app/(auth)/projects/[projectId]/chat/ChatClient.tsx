"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Citation } from "@/types/chat";
import { PageHeader } from "@/components/layout/PageHeader";
import { Markdown } from "@/components/ui/Markdown";
import { Bot, Send, Sparkles, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isError?: boolean;
}

export function ChatClient({ projectId }: { projectId: string }) {
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
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-6xl flex-col gap-5">
      <PageHeader
        title="Ask the knowledge base"
        subtitle="Answers are grounded in your connected project sources."
        icon={Bot}
      />

      <div className="border-border bg-card min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border p-4 shadow-sm sm:p-6">
        {messages.length === 0 && (
          <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
            <span className="bg-primary/10 text-primary mb-3 inline-flex size-11 items-center justify-center rounded-2xl">
              <Sparkles className="size-5" />
            </span>
            <p className="font-heading text-sm font-semibold">
              Ask your first question
            </p>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              Explore architecture, conventions, or anything found in the
              connected knowledge base.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === "user" ? "ml-auto max-w-2xl" : "max-w-2xl"}
          >
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
              {msg.role === "user" ? (
                <User className="size-3.5" />
              ) : (
                <Bot className="text-primary size-3.5" />
              )}
              {msg.role === "user" ? "You" : "Onboardly"}
            </div>
            <div
              className={[
                "rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.isError
                    ? "bg-destructive/10 text-destructive border-destructive/20 border"
                    : "bg-muted/60 border-border border",
              ].join(" ")}
            >
              {msg.role === "assistant" && !msg.isError ? (
                <Markdown>{msg.content}</Markdown>
              ) : (
                msg.content
              )}
            </div>

            {msg.citations && msg.citations.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {msg.citations.map((citation, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {citation.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="max-w-2xl">
            <div className="bg-muted/60 border-border rounded-2xl border px-4 py-3 text-sm">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="border-border bg-card flex gap-2 rounded-2xl border p-2 shadow-sm"
      >
        <Input
          placeholder="Ask about your project..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="size-4" />
          Send
        </Button>
      </form>
    </div>
  );
}
