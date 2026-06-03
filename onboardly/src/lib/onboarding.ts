// Onboarding tour helpers: persist whether the first-run walkthrough has been
// seen and define the ordered steps. Mirrors the localStorage pattern in
// `theme.ts` so behaviour stays consistent across the app.

export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  /** Matches a `data-tour="..."` attribute on the element to highlight. */
  target: string;
  title: string;
  description: string;
  /** Preferred side for the card; falls back automatically when there's no room. */
  placement?: TourPlacement;
}

// Bump the version suffix to re-show the tour to everyone after a major change.
export const TOUR_STORAGE_KEY = "onboardly-tour-completed-v1";

/** True when the user has already finished or dismissed the tour. */
export function hasSeenTour(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

/** Remember that the tour has been completed so it doesn't auto-open again. */
export function markTourSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures (private mode, quota) — worst case the tour reopens.
  }
}

// Ordered walkthrough shown on first visit and re-runnable from the help button.
// Targets reference `data-tour` anchors in the header and sidebar, which are
// present on every authenticated ("main") page. The walkthrough steps through
// each main route so new hires know exactly what lives where. Steps whose anchor
// isn't visible (e.g. the sidebar on mobile) are skipped automatically.
export const TOUR_STEPS: TourStep[] = [
  {
    target: "nav",
    title: "Your navigation",
    description:
      "The sidebar is your home base — every main area of Onboardly is one click away from here. Let's walk through each one.",
    placement: "right",
  },
  {
    target: "nav-overview",
    title: "Overview",
    description:
      "Your dashboard: onboarding progress at a glance, a welcome banner, and recent activity across your projects.",
    placement: "right",
  },
  {
    target: "nav-projects",
    title: "Projects",
    description:
      "Browse every project you're part of. Open one to see its hub, course, documents, members, and project chat.",
    placement: "right",
  },
  {
    target: "nav-repositories",
    title: "Repositories",
    description:
      "Connect and browse the GitHub repositories backing your projects — the source Onboardly grounds its answers in.",
    placement: "right",
  },
  {
    target: "nav-integrations",
    title: "Integrations",
    description:
      "Manage the connections that feed your knowledge base: GitHub, Slack, and internal docs.",
    placement: "right",
  },
  {
    target: "nav-plan",
    title: "My Plan",
    description:
      "Your personal onboarding checklist with the next steps to complete, across all your projects.",
    placement: "right",
  },
  {
    target: "nav-resources",
    title: "Resources",
    description:
      "All the documents and reference material gathered for your onboarding, in one searchable place.",
    placement: "right",
  },
  {
    target: "nav-assistant",
    title: "AI Assistant",
    description:
      "Ask anything about your company or codebase. Answers are grounded in your sources, with citations you can verify.",
    placement: "right",
  },
  {
    target: "nav-settings",
    title: "Settings",
    description: "Update your profile and preferences here.",
    placement: "right",
  },
  {
    target: "search",
    title: "Search anything",
    description:
      "Quickly find a project from anywhere — or press ⌘K / Ctrl+K to open search instantly.",
    placement: "bottom",
  },
  {
    target: "tasks",
    title: "Today's tasks",
    description:
      "Pick up where you left off. This opens your plan with the next steps in your onboarding.",
    placement: "bottom",
  },
  {
    target: "theme",
    title: "Light or dark",
    description: "Switch between light and dark mode whenever you like.",
    placement: "bottom",
  },
  {
    target: "help",
    title: "Need a refresher?",
    description:
      "Click the question mark any time to replay this quick tour. Welcome to Onboardly!",
    placement: "bottom",
  },
];
