// Onboarding course page — loads the project's GitHub repo and any saved course
// from the DB, then hands off to the client-side CoursePlayer.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CoursePlayer } from "@/components/course/CoursePlayer";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { loadCourseFromDb } from "@/lib/course/db";
import { getProjectAccess } from "@/lib/members/access";
import { ProjectRole, Provider } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // Gate first: never load or render course data for non-members.
  const access = await getProjectAccess(projectId);
  if (!access) {
    notFound();
  }

  const [githubConn, initialCourse] = await Promise.all([
    prisma.projectConnection.findUnique({
      where: { projectId_provider: { projectId, provider: Provider.GITHUB } },
      select: { externalRef: true },
    }),
    loadCourseFromDb(projectId),
  ]);

  const isAdmin = access.role === ProjectRole.ADMIN;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-1">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="size-4" />
          Back to project
        </Link>
      </Button>
      <CoursePlayer
        projectId={projectId}
        initialRepo={githubConn?.externalRef ?? undefined}
        initialCourse={initialCourse ?? undefined}
        isAdmin={isAdmin}
      />
    </div>
  );
}
