// Project overview — the project's details (name, description, status, connected
// repo/workspace) plus entry points to the course, chat, and admin surfaces.
// Org-scoped: 404s when the project isn't the current organization's.

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
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { getProject } from "@/lib/projects/queries";

export const dynamic = "force-dynamic";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) {
    notFound();
  }

  const sections = [
    {
      href: `/projects/${project.id}/course`,
      title: "Onboarding course",
      description: "AI-generated modules, lessons, and quizzes.",
    },
    {
      href: `/projects/${project.id}/chat`,
      title: "Ask the knowledge base",
      description: "RAG chat with cited sources.",
    },
    {
      href: `/projects/${project.id}/admin`,
      title: "Admin",
      description: "Manage docs, integrations, and regeneration.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description ? (
            <p className="text-muted-foreground text-sm">
              {project.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${project.id}/edit`}>Edit</Link>
          </Button>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
          <CardDescription>
            Sources this project&apos;s knowledge base is built from.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">
              GitHub repo
            </p>
            <p className="text-sm">
              {project.githubRepo ?? "Not connected"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">
              Slack workspace
            </p>
            <p className="text-sm">
              {project.slackWorkspace ?? "Not connected"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
