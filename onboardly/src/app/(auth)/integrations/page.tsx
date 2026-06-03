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

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const githubConnected = Boolean(
    (await cookies()).get(GH_PROVIDER_TOKEN_COOKIE)?.value,
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Integrations</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>GitHub</CardTitle>
            <CardDescription>
              Sign in with GitHub to browse your repositories. Ingestion also
              requires the Onboardly app installed on a repo (done per project).
            </CardDescription>
            <Badge
              className="mt-2 w-fit"
              variant={githubConnected ? "default" : "outline"}
            >
              {githubConnected ? "Signed in with GitHub" : "Not signed in"}
            </Badge>
          </CardHeader>
          <CardContent>
            {githubConnected ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/integrations/github">View repositories</Link>
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

        <Card>
          <CardHeader>
            <CardTitle>Slack</CardTitle>
            <CardDescription>
              Sync channels and threads for context.
            </CardDescription>
            <Badge className="mt-2 w-fit" variant="outline">
              Not connected
            </Badge>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
