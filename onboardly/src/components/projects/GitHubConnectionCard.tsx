"use client";

// GitHub connection panel on the project overview. Shows live connection state
// (Connected / Not installed / Error / No repo) and, for admins, the actions to
// install the App, verify access, and disconnect. Repo *selection* lives in the
// project edit form; this card manages the live connection only.

import * as React from "react";
import Link from "next/link";
import {
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  CircleDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  verifyGitHubConnection,
  disconnectGitHubConnection,
} from "@/lib/projects/connection-actions";
import { ConnectionStatus } from "@/generated/prisma/enums";

interface GitHubConnectionCardProps {
  projectId: string;
  /** "owner/repo" reference, or null when no repo is set on the project. */
  repo: string | null;
  status: ConnectionStatus;
  /** ISO string of the last successful verification, or null. */
  connectedAt: string | null;
  /** Whether the current viewer can manage the connection (admin). */
  canManage: boolean;
  /** Project-scoped App install URL (carries ?state=projectId). */
  installAppUrl: string;
}

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function GitHubConnectionCard({
  projectId,
  repo,
  status,
  connectedAt,
  canManage,
  installAppUrl,
}: GitHubConnectionCardProps) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleVerify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyGitHubConnection(projectId);
      if (!result.ok) setError(result.error);
    });
  }

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      const result = await disconnectGitHubConnection(projectId);
      if (!result.ok) setError(result.error);
    });
  }

  const connected = status === ConnectionStatus.CONNECTED;
  const verifiedWhen = formatWhen(connectedAt);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <FolderGit2 className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              GitHub repo
            </p>
            <p className="truncate text-sm font-medium">
              {repo ?? "No repository set"}
            </p>
            <StatusLine status={status} repo={repo} verifiedWhen={verifiedWhen} />
          </div>
        </div>

        {canManage ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {repo ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={connected ? "outline" : "default"}
                  onClick={handleVerify}
                  disabled={isPending}
                >
                  {isPending ? "Verifying…" : connected ? "Re-verify" : "Verify access"}
                </Button>
                {!connected ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={installAppUrl} target="_blank" rel="noreferrer">
                      Install App
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleDisconnect}
                    disabled={isPending}
                  >
                    Disconnect
                  </Button>
                )}
              </>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href={`/projects/${projectId}/edit`}>Set repository</Link>
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}

function StatusLine({
  status,
  repo,
  verifiedWhen,
}: {
  status: ConnectionStatus;
  repo: string | null;
  verifiedWhen: string | null;
}) {
  if (!repo) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <CircleDashed className="size-3.5" />
        Not connected
      </span>
    );
  }

  if (status === ConnectionStatus.CONNECTED) {
    return (
      <span className="text-success inline-flex items-center gap-1.5 text-xs">
        <CheckCircle2 className="size-3.5" />
        Connected{verifiedWhen ? ` · verified ${verifiedWhen}` : ""}
      </span>
    );
  }

  if (status === ConnectionStatus.ERROR) {
    return (
      <span className="text-destructive inline-flex items-center gap-1.5 text-xs">
        <AlertCircle className="size-3.5" />
        Connection error — verify access
      </span>
    );
  }

  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
      <CircleDashed className="size-3.5" />
      Not verified — install the app, then verify
    </span>
  );
}
