"use client";

// Global AI Assistant. The RAG chat API is project-scoped, so the user first
// picks which project's knowledge base to ask about (chips), then chats. The
// conversation resets when the active project changes. Mirrors the project
// ChatClient flow (POST /api/chat) but adds the project selector.

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/Markdown";
import { cn } from "@/lib/utils";
import type { Citation } from "@/types/chat";

/** Minimal project shape sent to the client for the selector. */
export interface AssistantProject {
  id: string;
  name: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isError?: boolean;
}

export function AssistantClient({
  projects,
}: {
  projects: AssistantProject[];
}) {
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Switching projects starts a fresh conversation against that knowledge base.
  function selectProject(id: string) {
    if (id === activeProjectId) return;
    setActiveProjectId(id);
    setMessages([]);
    setChatId(undefined);
    setInput("");
  }

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
        body: JSON.stringify({ message: text, projectId: activeProjectId, chatId }),
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
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-6xl flex-col gap-4">
      {/* Project selector — which knowledge base to ask about. */}
      {projects.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <FolderKanban className="size-3.5" />
            Asking about
          </span>
          {projects.map((project) => {
            const active = project.id === activeProjectId;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => selectProject(project.id)}
                aria-pressed={active}
                className={cn(
                  "max-w-[12rem] truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/60",
                )}
              >
                {project.name}
              </button>
            );
          })}
        </div>
      ) : null}

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
              Answers are grounded in the selected project&apos;s documents,
              repo, and synced sources — with citations.
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
          placeholder="Ask about your onboarding..."
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
