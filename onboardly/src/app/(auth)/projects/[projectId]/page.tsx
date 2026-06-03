// Project overview — the project's details (name, description, status, connected
// repo/workspace) plus entry points to the course, chat, members, and admin
// surfaces. Access via getProjectAccess: ACTIVE members can view;
// only admins see Edit/Delete and the Admin section. 404s when no access.

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
import { RoleBadge } from "@/components/members/RoleBadge";
import { GitHubConnectionCard } from "@/components/projects/GitHubConnectionCard";
import { getProjectAccess } from "@/lib/members/access";
import {
  getProjectConnection,
  getProjectConnectionRefs,
} from "@/lib/projects/connections";
import { githubAppInstallUrl } from "@/lib/github/oauth";
import {
  ProjectRole,
  Provider,
  ConnectionStatus,
} from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const access = await getProjectAccess(projectId);
  if (!access) {
    notFound();
  }
  const { project, role } = access;
  const isAdmin = role === ProjectRole.ADMIN;
  const connections = await getProjectConnectionRefs(project.id);
  const githubConnection = await getProjectConnection(
    project.id,
    Provider.GITHUB,
  );

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
      href: `/projects/${project.id}/members`,
      title: "Members",
      description: "See who's on this project and their progress.",
    },
    // Admin surface is admin-only.
    ...(isAdmin
      ? [
          {
            href: `/projects/${project.id}/admin`,
            title: "Admin",
            description: "Manage docs, integrations, and regeneration.",
          },
        ]
      : []),
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
            <RoleBadge role={role} />
          </div>
          {project.description ? (
            <p className="text-muted-foreground text-sm">
              {project.description}
            </p>
          ) : null}
        </div>
        {isAdmin ? (
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${project.id}/edit`}>Edit</Link>
            </Button>
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
          <CardDescription>
            Sources this project&apos;s knowledge base is built from.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <GitHubConnectionCard
            projectId={project.id}
            repo={connections.githubRepo}
            status={
              githubConnection?.status ?? ConnectionStatus.DISCONNECTED
            }
            connectedAt={githubConnection?.connectedAt?.toISOString() ?? null}
            canManage={isAdmin}
            installAppUrl={githubAppInstallUrl(project.id)}
          />
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">
              Slack workspace
            </p>
            <p className="text-sm">
              {connections.slackWorkspace ?? "Not connected"}
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
