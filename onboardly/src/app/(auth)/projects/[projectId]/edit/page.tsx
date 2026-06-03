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
import { PageHeader } from "@/components/layout/PageHeader";
import { Pencil, X } from "lucide-react";

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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit project"
        subtitle={project.name}
        icon={Pencil}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href={`/projects/${project.id}`}>
              <X className="size-4" />
              Cancel
            </Link>
          </Button>
        }
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="text-primary size-4" />
            Project settings
          </CardTitle>
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
