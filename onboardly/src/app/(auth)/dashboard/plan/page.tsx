// My Plan — the user's full onboarding plan, aggregated across every project
// they're an ACTIVE member of, grouped per project with that project's progress.
// Each lesson links into the project course player. Server component; data is
// access-guarded in the lib.

import Link from "next/link";
import { ListChecks, FolderKanban, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusIcon, StatusLabel } from "@/components/dashboard/status";
import { getPlanData } from "@/lib/dashboard/overview";

export const dynamic = "force-dynamic";

export default async function MyPlanPage() {
  const plan = await getPlanData();

  const header = (
    <PageHeader
      title="My Plan"
      subtitle="Your onboarding plan across all your projects."
      icon={ListChecks}
      badges={
        plan.totalLessons > 0 ? (
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
            {plan.completedLessons}/{plan.totalLessons} lessons · {plan.percent}%
          </span>
        ) : null
      }
    />
  );

  if (plan.hasNoProjects) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {header}
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Your plan is built from your projects' courses. Join or create a project to get started."
          action={
            <Button asChild>
              <Link href="/projects">Go to Projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (plan.hasNoCourses) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {header}
        <EmptyState
          icon={Sparkles}
          title="No course generated yet"
          description="Once a course is generated for one of your projects, its lessons will appear here as your plan."
          action={
            <Button asChild variant="outline">
              <Link href="/projects">Browse projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {header}

      <div className="flex flex-col gap-5">
        {plan.projects.map((project) => (
          <Card key={project.projectId}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="text-primary size-4 shrink-0" />
                    <h2 className="font-heading truncate text-sm font-semibold">
                      {project.projectName}
                    </h2>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {project.courseTitle}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <span className="text-muted-foreground text-xs">
                    {project.completedLessons}/{project.totalLessons} ·{" "}
                    {project.percent}%
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link href={project.href}>
                      Open course
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
              {/* Per-project progress bar. */}
              <div
                className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={project.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${project.percent}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {project.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5"
                    >
                      <StatusIcon status={item.status} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {item.moduleTitle}
                        </p>
                      </div>
                      <StatusLabel status={item.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
