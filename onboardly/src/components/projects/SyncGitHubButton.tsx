"use client";

// Admin-only button that triggers GitHub repo sync into the knowledge base.
// Shows the last sync time and file/chunk counts when available.

import { useEffect, useState } from "react";
import { GitBranch, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncStatus {
  docCount: number;
  lastSyncedAt: string | null;
}

interface SyncResult {
  synced: number;
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

export function SyncGitHubButton({ projectId }: Props) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/github/sync?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d: SyncStatus) => setStatus(d))
      .catch(() => null);
  }, [projectId]);

  async function handleSync() {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = (await res.json()) as SyncResult;
      if (!res.ok) {
        setError(data.error ?? "Sync failed.");
      } else {
        setResult(data);
        setStatus((prev) => ({
          docCount: data.synced,
          lastSyncedAt: new Date().toISOString(),
          ...(prev ?? {}),
        }));
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" disabled={running} onClick={handleSync}>
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <GitBranch className="size-3.5" />
          )}
          <span className="ml-1.5">{running ? "Syncing…" : "Sync repository"}</span>
        </Button>

        {status && status.lastSyncedAt && (
          <span className="text-muted-foreground text-xs">
            Last synced {formatDate(status.lastSyncedAt)} · {status.docCount} files
          </span>
        )}
        {status && !status.lastSyncedAt && (
          <span className="text-muted-foreground text-xs">Not synced yet</span>
        )}
      </div>

      {result && result.errors.length === 0 && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle2 className="size-3.5" />
          Synced {result.synced} files · embedded {result.embedded} new chunks
        </p>
      )}

      {result && result.errors.length > 0 && (
        <p className="text-destructive flex items-center gap-1 text-xs">
          <AlertCircle className="size-3.5" />
          {result.synced} synced · {result.errors.length} error(s) — {result.errors[0]}
        </p>
      )}

      {error && (
        <p className="text-destructive flex items-center gap-1 text-xs">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
