// GitHub repositories — lists the signed-in user's repos via their GitHub
// OAuth provider_token (captured at the auth callback). A single page-level App
// install action keeps repository browsing focused on reliable repo metadata.

import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { RepositoriesView } from "@/components/integrations/RepositoriesView";
import { createClient } from "@/lib/supabase/server";
import { FolderGit2, Plus } from "lucide-react";
import {
  GH_PROVIDER_TOKEN_COOKIE,
  githubAppInstallUrl,
  listUserRepos,
  type GitHubRepo,
} from "@/lib/github/oauth";

export const dynamic = "force-dynamic";

export default async function GitHubReposPage() {
  const token = (await cookies()).get(GH_PROVIDER_TOKEN_COOKIE)?.value;

  // No GitHub token — the user signed in with email/password, or the token
  // expired. Prompt them to (re)connect via GitHub.
  if (!token) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Header />
        <EmptyState
          icon={FolderGit2}
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
      <div className="mx-auto max-w-6xl space-y-6">
        <Header />
        <EmptyState
          icon={FolderGit2}
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const currentGitHubLogin =
    typeof metadata?.user_name === "string"
      ? metadata.user_name.toLowerCase()
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Header />
      {repos.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No repositories found"
          description="We couldn’t find any repositories for your GitHub account."
        />
      ) : (
        <RepositoriesView
          repos={repos}
          currentGitHubLogin={currentGitHubLogin}
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <PageHeader
      title="GitHub repositories"
      subtitle="Browse and organize repositories available through your GitHub sign-in."
      icon={FolderGit2}
      actions={
        <Button asChild size="sm">
          <Link href={githubAppInstallUrl()} target="_blank" rel="noreferrer">
            <Plus className="size-4" />
            Install GitHub App
          </Link>
        </Button>
      }
    />
  );
}
