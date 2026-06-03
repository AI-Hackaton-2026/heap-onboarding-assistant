// Integrations overview — GitHub and Slack connection state. The GitHub card
// reflects whether the user has a live GitHub session (provider_token captured
// at the auth callback) and links through to the repository listing.

import Link from "next/link";
import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GH_PROVIDER_TOKEN_COOKIE } from "@/lib/github/oauth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowRight, PlugZap, CheckCircle2, CircleDashed } from "lucide-react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const githubConnected = Boolean(
    (await cookies()).get(GH_PROVIDER_TOKEN_COOKIE)?.value,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Integrations"
        subtitle="Connect the tools that power your onboarding knowledge."
        icon={PlugZap}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-xl">
                <GitHubIcon className="size-5" />
              </span>
              <Badge variant={githubConnected ? "default" : "outline"}>
                {githubConnected ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <CircleDashed className="size-3.5" />
                )}
                {githubConnected ? "Signed in with GitHub" : "Not signed in"}
              </Badge>
            </div>
            <CardTitle>GitHub</CardTitle>
            <CardDescription>
              Sign in with GitHub to browse your repositories. Ingestion also
              requires the Onboardly app installed on a repo (done per project).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {githubConnected ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/integrations/github">
                  View repositories
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login?redirectTo=/integrations/github">
                  Sign in with GitHub
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-xl">
                <SlackIcon className="size-5" />
              </span>
              <Badge variant="outline">
                <CircleDashed className="size-3.5" />
                Not connected
              </Badge>
            </div>
            <CardTitle>Slack</CardTitle>
            <CardDescription>
              Sync channels and threads for context.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
