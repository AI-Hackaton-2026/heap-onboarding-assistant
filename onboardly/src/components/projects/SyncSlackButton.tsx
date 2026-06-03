"use client";

// Admin-only button that syncs mock Slack data into the knowledge base.
// Shows workspace name, last sync time, and channel count when available.

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

interface SyncStatus {
  channelCount: number;
  lastSyncedAt: string | null;
  workspaceName: string | null;
}

interface SyncResult {
  channels: number;
  embedded: number;
  errors: string[];
  error?: string;
}

interface Props {
  projectId: string;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function SyncSlackButton({ projectId }: Props) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/slack/sync?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d: SyncStatus) => setStatus(d))
      .catch(() => null);
  }, [projectId]);

  async function handleSync() {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/slack/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = (await res.json()) as SyncResult;
      if (!res.ok) {
        setError(data.error ?? "Sync failed.");
      } else {
        setResult(data);
        setStatus({
          channelCount: data.channels,
          lastSyncedAt: new Date().toISOString(),
          workspaceName: status?.workspaceName ?? "Acme Engineering",
        });
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setRunning(false);
    }
  }

  const isConnected = status?.workspaceName !== null && status?.workspaceName !== undefined;

  return (
    <div className="border-border bg-muted/20 flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
          <SlackIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Slack workspace
            </p>
            {isConnected && (
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="size-3" />
                Connected (mock)
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium">
            {status?.workspaceName ?? "Not connected"}
          </p>
          {status?.lastSyncedAt && (
            <p className="text-muted-foreground text-xs">
              Last synced {formatDate(status.lastSyncedAt)} · {status.channelCount} channel{status.channelCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={running}
          onClick={handleSync}
          className="w-fit"
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <SlackIcon className="size-3.5" />
          )}
          <span className="ml-1.5">
            {running ? "Syncing…" : isConnected ? "Re-sync Slack" : "Connect Slack (mock)"}
          </span>
        </Button>

        {result && result.errors.length === 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            Synced {result.channels} channels · embedded {result.embedded} new chunks
          </p>
        )}

        {result && result.errors.length > 0 && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <AlertCircle className="size-3.5" />
            {result.channels} synced · {result.errors.length} error(s) — {result.errors[0]}
          </p>
        )}

        {error && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <AlertCircle className="size-3.5" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
