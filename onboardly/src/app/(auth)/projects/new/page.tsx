// New project page — renders the create form. The createProject action writes
// a user-owned project with its creator ADMIN membership and redirects to it.

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { githubAppInstallUrl } from "@/lib/github/oauth";
import { listAvailableGitHubRepos } from "@/lib/projects/github";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const githubRepos = await listAvailableGitHubRepos();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">New project</h1>
          <p className="text-muted-foreground text-sm">
            Set up a project to connect a repo, sync Slack, and build its
            knowledge base.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/projects">Cancel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>You can change any of this later.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            githubRepos={githubRepos}
            githubAppInstallUrl={githubAppInstallUrl()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
