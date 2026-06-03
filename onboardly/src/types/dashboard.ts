// Types for the new-hire dashboard (onboarding overview). These describe the
// shape of the placeholder/mock data that drives the dashboard cards this
// slice; real data wiring comes later. See src/data/mock/dashboard.ts.

/** Status of a single onboarding step / focus item. */
export type StepStatus = "completed" | "in-progress" | "up-next";

/** A task in the "Today's focus" card. */
export interface FocusTask {
  id: string;
  title: string;
  subtitle: string;
  /** Human-readable estimate, e.g. "30 min". */
  duration: string;
  status: StepStatus;
}

/** A step in the "My onboarding progress" timeline. */
export interface OnboardingStep {
  id: string;
  title: string;
  status: StepStatus;
}

/** An event in the "Upcoming" card. */
export interface UpcomingEvent {
  id: string;
  title: string;
  /** Pre-formatted date + time, e.g. "May 16, 2024 · 10:30 AM". */
  when: string;
  /** Optional link for the Join action; "#" when not yet wired. */
  joinHref: string;
}

/** A resource row in the "Recommended next reads" card. */
export interface RecommendedRead {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/** A row in the "Recent activity" card. */
export interface ActivityItem {
  id: string;
  /** What happened, e.g. 'Completed "Company & Product Overview"'. */
  text: string;
  /** Pre-formatted date, e.g. "May 14, 2024". */
  date: string;
  status: StepStatus;
}

/** All data needed to render the dashboard overview. */
export interface DashboardData {
  /** First name shown in the welcome banner. */
  userName: string;
  /** Overall onboarding completion, 0–100, shown in the progress ring. */
  progressPercent: number;
  todaysFocus: FocusTask[];
  onboardingSteps: OnboardingStep[];
  upcoming: UpcomingEvent[];
  recommendedReads: RecommendedRead[];
  /** A sample question surfaced in the "Ask Onboardly" card. */
  sampleQuestion: string;
  recentActivity: ActivityItem[];
}
