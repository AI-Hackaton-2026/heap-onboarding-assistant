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
import { PageHeader } from "@/components/layout/PageHeader";
import { FolderPlus, X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const githubRepos = await listAvailableGitHubRepos();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New project"
        subtitle="Connect a repository, describe the workspace, and start building its onboarding knowledge."
        icon={FolderPlus}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/projects">
              <X className="size-4" />
              Cancel
            </Link>
          </Button>
        }
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="text-primary size-4" />
            Project setup
          </CardTitle>
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
