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
import {
  ArrowRight,
  FolderGit2,
  MessageSquare,
  PlugZap,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";

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
                <FolderGit2 className="size-5" />
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
                <MessageSquare className="size-5" />
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
