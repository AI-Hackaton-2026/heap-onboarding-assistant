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
import { CreatedToast } from "@/components/projects/CreatedToast";
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
import { PageHeader } from "@/components/layout/PageHeader";
import { Markdown } from "@/components/ui/Markdown";
import { SyncGitHubButton } from "@/components/projects/SyncGitHubButton";
function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  FileText,
  FolderKanban,
  Pencil,
  Settings,
  Users,
} from "lucide-react";

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
      icon: BookOpen,
    },
    {
      href: `/projects/${project.id}/chat`,
      title: "Ask the knowledge base",
      description: "RAG chat with cited sources.",
      icon: Bot,
    },
    {
      href: `/projects/${project.id}/documents`,
      title: "Documents",
      description: "Uploaded PDFs, Markdown, DOCX, and TXT source files.",
      icon: FileText,
    },
    {
      href: `/projects/${project.id}/members`,
      title: "Members",
      description: "See who's on this project and their progress.",
      icon: Users,
    },
    // Admin surface is admin-only.
    ...(isAdmin
      ? [
          {
            href: `/projects/${project.id}/admin`,
            title: "Admin",
            description: "Manage docs, integrations, and regeneration.",
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CreatedToast />
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-1">
        <Link href="/projects">
          <ArrowLeft className="size-4" />
          All projects
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        subtitle="Project onboarding workspace"
        icon={FolderKanban}
        badges={
          <>
            <ProjectStatusBadge status={project.status} />
            <RoleBadge role={role} />
          </>
        }
        actions={
          isAdmin ? (
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/projects/${project.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <DeleteProjectButton
                projectId={project.id}
                projectName={project.name}
              />
            </div>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl">
                      <Icon className="size-5" />
                    </span>
                    <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="text-primary size-4" />
            Connections
          </CardTitle>
          <CardDescription>
            Sources this project&apos;s knowledge base is built from.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <GitHubConnectionCard
            projectId={project.id}
            repo={connections.githubRepo}
            status={githubConnection?.status ?? ConnectionStatus.DISCONNECTED}
            connectedAt={githubConnection?.connectedAt?.toISOString() ?? null}
            canManage={isAdmin}
            installAppUrl={githubAppInstallUrl(project.id)}
          />
          {isAdmin && githubConnection?.status === ConnectionStatus.CONNECTED ? (
            <SyncGitHubButton projectId={project.id} />
          ) : null}
          <div className="border-border bg-muted/20 flex items-start gap-3 rounded-xl border p-4">
            <span className="bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
              <SlackIcon className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Slack workspace
              </p>
              <p className="text-sm font-medium">
                {connections.slackWorkspace ?? "Not connected"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {project.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="text-primary size-4" />
              About this project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown>{project.description}</Markdown>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
