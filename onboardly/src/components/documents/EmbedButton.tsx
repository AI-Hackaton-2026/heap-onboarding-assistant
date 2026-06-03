"use client";

// Admin-only button that triggers the embedding pipeline for a project.
// Shows live progress: "X / Y chunks embedded".

import { useEffect, useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Progress {
  embedded: number;
  total: number;
}

interface EmbedResult {
  embedded: number;
  skipped: number;
  total: number;
  errors: string[];
}

interface Props {
  projectId: string;
  refreshTrigger?: number;
}

export function EmbedButton({ projectId, refreshTrigger = 0 }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<EmbedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial progress on mount.
  useEffect(() => {
    fetch(`/api/knowledge/generate?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data: Progress) => setProgress(data))
      .catch(() => null);
  }, [projectId, refreshTrigger]);

  const allEmbedded = progress !== null && progress.total > 0 && progress.embedded >= progress.total;

  async function handleEmbed() {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/knowledge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = (await res.json()) as EmbedResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Embedding failed.");
      } else {
        setResult(data);
        setProgress({ embedded: (progress?.embedded ?? 0) + data.embedded, total: data.total + data.skipped });
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
        <Button
          size="sm"
          variant={allEmbedded ? "outline" : "default"}
          disabled={running || progress?.total === 0}
          onClick={handleEmbed}
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : allEmbedded ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          <span className="ml-1.5">
            {running ? "Embedding…" : allEmbedded ? "Re-embed" : "Generate embeddings"}
          </span>
        </Button>

        {progress !== null && (
          <span className="text-muted-foreground text-xs">
            {progress.embedded} / {progress.total} chunks embedded
          </span>
        )}
      </div>

      {result && result.errors.length === 0 && (
        <p className="text-success text-xs">
          ✓ Embedded {result.embedded} new chunk{result.embedded !== 1 ? "s" : ""}.
          {result.skipped > 0 ? ` (${result.skipped} already done)` : ""}
        </p>
      )}

      {result && result.errors.length > 0 && (
        <p className="text-destructive text-xs">
          {result.errors.length} error{result.errors.length !== 1 ? "s" : ""} —{" "}
          {result.errors[0]}
        </p>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
