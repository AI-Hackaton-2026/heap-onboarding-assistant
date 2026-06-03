// New-hire dashboard — the onboarding overview a new hire lands on after login.
// Wired to live data aggregated across every project the user is an ACTIVE
// member of (getOverviewData). Cards are reused as-is; OverviewData is mapped to
// their existing prop shapes here. Empty states cover "no projects" and "no
// course generated yet". Server component — all reads run under the auth session.

import Link from "next/link";
import { FolderKanban, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { TodaysFocusCard } from "@/components/dashboard/TodaysFocusCard";
import { OnboardingProgressCard } from "@/components/dashboard/OnboardingProgressCard";
import { RecommendedReadsCard } from "@/components/dashboard/RecommendedReadsCard";
import { AskOnboardlyCard } from "@/components/dashboard/AskOnboardlyCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { getOverviewData } from "@/lib/dashboard/overview";
import type {
  FocusTask,
  OnboardingStep,
  RecommendedRead,
  ActivityItem,
} from "@/types/dashboard";
import type { OverviewData } from "@/types/overview";

// User-specific data — always render fresh, never statically cached.
export const dynamic = "force-dynamic";

const SAMPLE_QUESTION = "How do I get set up for my role?";

/** Map aggregated plan items to the Today's-focus card shape. */
function toFocusTasks(data: OverviewData): FocusTask[] {
  return data.focus.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.projectName} · ${item.moduleTitle}`,
    duration: "",
    status: item.status,
  }));
}

/** Map aggregated plan items to the onboarding-timeline card shape. */
function toSteps(data: OverviewData): OnboardingStep[] {
  return data.steps.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
  }));
}

/** Map aggregated documents to the recommended-reads card shape. */
function toReads(data: OverviewData): RecommendedRead[] {
  return data.reads.map((read) => ({
    id: read.id,
    title: read.title,
    subtitle: read.projectName,
    href: read.href,
  }));
}

/** Map the aggregated activity feed to the recent-activity card shape. */
function toActivity(data: OverviewData): ActivityItem[] {
  return data.activity.map((item) => ({
    id: item.id,
    text: item.text,
    date: item.date,
    status: item.status,
  }));
}

export default async function DashboardPage() {
  const data = await getOverviewData();

  // No projects at all — point the user at Projects to get started.
  if (data.hasNoProjects) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
        <WelcomeBanner userName={data.user.name} progressPercent={0} />
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Join or create a project to start your onboarding. Your plan, resources, and progress all live inside a project."
          action={
            <Button asChild>
              <Link href="/projects">
                Go to Projects
                <ArrowRight />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const focus = toFocusTasks(data);
  const steps = toSteps(data);
  const reads = toReads(data);
  const activity = toActivity(data);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
      <WelcomeBanner
        userName={data.user.name}
        progressPercent={data.progress.percent}
      />

      {/* Prominent entry point into the user's projects. */}
      <Link
        href="/projects"
        className="group border-border from-primary/10 via-card to-card hover:border-primary/40 flex items-center justify-between gap-4 rounded-xl border bg-linear-to-r p-5 transition-colors sm:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="bg-primary/12 text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
            <FolderKanban className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold">
              Go to your projects
            </p>
            <p className="text-muted-foreground text-sm">
              Open a project to dive into its course, docs, and team.
            </p>
          </div>
        </div>
        <ArrowRight className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-colors" />
      </Link>

      {data.hasNoCourses ? (
        <EmptyState
          icon={Sparkles}
          title="No course generated yet"
          description="Once a course is generated for one of your projects, your plan, focus, and progress will show up here."
          action={
            <Button asChild variant="outline">
              <Link href="/projects">Browse projects</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 sm:gap-6">
          <TodaysFocusCard tasks={focus} />
          <OnboardingProgressCard steps={steps} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <RecommendedReadsCard reads={reads} />
        <AskOnboardlyCard sampleQuestion={SAMPLE_QUESTION} />
      </div>

      <RecentActivityCard items={activity} />
    </div>
  );
}
