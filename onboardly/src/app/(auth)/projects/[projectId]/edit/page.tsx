// Edit project page — prefills the form from the (org-scoped) project and
// updates it via the updateProject action. 404s when the project isn't found
// or belongs to another organization.

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getProject } from "@/lib/projects/queries";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Edit project</h1>
          <p className="text-muted-foreground text-sm">{project.name}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/projects/${project.id}`}>Cancel</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>Update this project&apos;s settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              githubRepo: project.githubRepo,
              slackWorkspace: project.slackWorkspace,
              status: project.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
