// Projects list — every project where the current user has an ACTIVE
// membership. Each card is tagged with their role. Access is enforced in app
// logic because Prisma bypasses RLS.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { listAccessibleProjects } from "@/lib/members/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { FolderKanban, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listAccessibleProjects();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Your onboarding workspaces, knowledge sources, and team progress."
        icon={FolderKanban}
        actions={
          <Button asChild size="sm">
            <Link href="/projects/new">
              <Plus className="size-4" />
              New project
            </Link>
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to connect a repo, sync Slack, and build its knowledge base."
          action={
            <Button asChild>
              <Link href="/projects/new">Create your first project</Link>
            </Button>
          }
        />
      ) : (
        <ProjectsView projects={projects} />
      )}
      {/* TODO(redesign): show connected repo hints when the existing project
          list data includes connection metadata without adding a new query. */}
    </div>
  );
}
