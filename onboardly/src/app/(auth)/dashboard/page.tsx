// New-hire dashboard — the onboarding overview a new hire lands on after login.
// Composed of reusable card components driven by placeholder/mock data this
// slice (no DB reads). The project list moved to /projects.

import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { TodaysFocusCard } from "@/components/dashboard/TodaysFocusCard";
import { OnboardingProgressCard } from "@/components/dashboard/OnboardingProgressCard";
import { UpcomingCard } from "@/components/dashboard/UpcomingCard";
import { RecommendedReadsCard } from "@/components/dashboard/RecommendedReadsCard";
import { AskOnboardlyCard } from "@/components/dashboard/AskOnboardlyCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { mockDashboard } from "@/data/mock/dashboard";

export default function DashboardPage() {
  const data = mockDashboard;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
      <WelcomeBanner
        userName={data.userName}
        progressPercent={data.progressPercent}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 sm:gap-6">
        <TodaysFocusCard tasks={data.todaysFocus} />
        <OnboardingProgressCard steps={data.onboardingSteps} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        <UpcomingCard events={data.upcoming} />
        <RecommendedReadsCard reads={data.recommendedReads} />
        <AskOnboardlyCard sampleQuestion={data.sampleQuestion} />
      </div>

      <RecentActivityCard items={data.recentActivity} />
    </div>
  );
}
