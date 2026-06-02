// Onboarding course page — renders the Gemini-powered Academy-style course player.

import { CoursePlayer } from "@/components/course/CoursePlayer";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <CoursePlayer projectId={projectId} />;
}
