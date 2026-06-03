// Onboarding course page — renders the Gemini-powered Academy-style course player.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CoursePlayer } from "@/components/course/CoursePlayer";
import { ArrowLeft } from "lucide-react";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-1">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="size-4" />
          Back to project
        </Link>
      </Button>
      <CoursePlayer projectId={projectId} />
    </div>
  );
}
