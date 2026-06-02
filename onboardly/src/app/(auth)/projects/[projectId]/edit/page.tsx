// Edit project page — prefills the form and updates it via the updateProject
// action. Admin-only: members have read access to the project but cannot edit,
// so non-admins 404 here (the action re-checks admin server-side regardless).

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
import { requireProjectAdmin } from "@/lib/members/access";
import { getProjectConnectionRefs } from "@/lib/projects/connections";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const access = await requireProjectAdmin(projectId);
  if (!access) {
    notFound();
  }
  const project = access.project;
  const connections = await getProjectConnectionRefs(project.id);

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
          <CardDescription>
            Update this project&apos;s settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              githubRepo: connections.githubRepo,
              slackWorkspace: connections.slackWorkspace,
              status: project.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
