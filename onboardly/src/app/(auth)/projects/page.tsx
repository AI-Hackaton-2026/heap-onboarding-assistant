// Projects list — every project the current user can see: those they own plus
// projects they're an ACTIVE member of (cross-org). Each card is tagged with the
// caller's role. Access is enforced in app logic (Prisma bypasses RLS).

import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { RoleBadge } from "@/components/members/RoleBadge";
import { listAccessibleProjects } from "@/lib/members/queries";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listAccessibleProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">Projects</h1>
        <Button asChild size="sm">
          <Link href="/projects/new">New project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to connect a repo, sync Slack, and build its knowledge base."
          action={
            <Button asChild>
              <Link href="/projects/new">Create your first project</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(({ project, role }) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description ?? "No description yet."}
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ProjectStatusBadge status={project.status} />
                    <RoleBadge role={role} />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
