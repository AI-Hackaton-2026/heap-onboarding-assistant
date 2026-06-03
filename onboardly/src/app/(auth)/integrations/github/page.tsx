// GitHub repositories — lists the signed-in user's repos via their GitHub
// OAuth provider_token (captured at the auth callback). Each repo is flagged
// "Ingestion-ready" when the Onboardly GitHub App is installed on it; repos
// without the App link out to install it (the Phase-3 ingestion path).

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
import { EmptyState } from "@/components/ui/empty-state";
import {
  GH_PROVIDER_TOKEN_COOKIE,
  githubAppInstallUrl,
  listUserRepos,
  type GitHubRepo,
} from "@/lib/github/oauth";

export const dynamic = "force-dynamic";

function RepoRow({ repo }: { repo: GitHubRepo }) {
  return (
    <div className="border-border flex flex-col gap-2 border-b py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={repo.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            {repo.fullName}
          </Link>
          <Badge variant={repo.private ? "secondary" : "outline"}>
            {repo.private ? "Private" : "Public"}
          </Badge>
          {repo.ingestionReady ? (
            <Badge variant="default">Ingestion-ready</Badge>
          ) : null}
        </div>
        {repo.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {repo.description}
          </p>
        ) : null}
        {repo.language ? (
          <p className="text-muted-foreground text-xs">{repo.language}</p>
        ) : null}
      </div>
      <div className="shrink-0">
        {repo.ingestionReady ? (
          <Button variant="outline" size="sm" disabled>
            Ingestion-ready
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={githubAppInstallUrl()} target="_blank" rel="noreferrer">
              Install app
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default async function GitHubReposPage() {
  const token = (await cookies()).get(GH_PROVIDER_TOKEN_COOKIE)?.value;

  // No GitHub token — the user signed in with email/password, or the token
  // expired. Prompt them to (re)connect via GitHub.
  if (!token) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          title="GitHub not connected"
          description="Sign in with GitHub to list your repositories. If you signed in with email, log out and choose “Continue with GitHub”."
          action={
            <Button asChild>
              <Link href="/login?redirectTo=/integrations/github">
                Connect GitHub
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  let repos: GitHubRepo[];
  try {
    repos = await listUserRepos(token);
  } catch {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          title="Couldn’t load your repositories"
          description="Your GitHub session may have expired. Reconnect with GitHub and try again."
          action={
            <Button asChild>
              <Link href="/login?redirectTo=/integrations/github">
                Reconnect GitHub
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const readyCount = repos.filter((r) => r.ingestionReady).length;

  return (
    <div className="space-y-6">
      <Header />
      {repos.length === 0 ? (
        <EmptyState
          title="No repositories found"
          description="We couldn’t find any repositories for your GitHub account."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your repositories</CardTitle>
            <CardDescription>
              {repos.length}{" "}
              {repos.length === 1 ? "repository" : "repositories"}
              {readyCount > 0 ? ` · ${readyCount} ingestion-ready` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {repos.map((repo) => (
              <RepoRow key={repo.id} repo={repo} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">GitHub</h1>
      <p className="text-muted-foreground text-sm">
        Repositories from your GitHub account. Install the Onboardly app on a
        repo to make it ingestion-ready.
      </p>
    </div>
  );
}
