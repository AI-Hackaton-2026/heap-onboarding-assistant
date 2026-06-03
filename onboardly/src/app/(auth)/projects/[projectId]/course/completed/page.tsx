// Course completion page — shown after the user finishes all lessons.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LayoutDashboard, MessageSquare } from "lucide-react";

export default async function CourseCompletedPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-success/10 mb-6 flex size-20 items-center justify-center rounded-full">
        <CheckCircle2 className="text-success size-10" />
      </div>

      <h1 className="font-heading mb-3 text-3xl font-semibold sm:text-4xl">
        Course completed!
      </h1>
      <p className="text-muted-foreground mb-10 max-w-md text-base">
        You&apos;ve finished all lessons in this onboarding course. You&apos;re
        all set — keep exploring or ask Onboardly anything you need.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 size-4" />
            Go to Overview
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={`/projects/${projectId}/chat`}>
            <MessageSquare className="mr-2 size-4" />
            Ask Onboardly
          </Link>
        </Button>
      </div>
    </div>
  );
}
