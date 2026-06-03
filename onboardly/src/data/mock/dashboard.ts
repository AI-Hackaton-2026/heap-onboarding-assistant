// Placeholder/mock data for the new-hire dashboard (onboarding overview).
// Kept separate from production logic; the dashboard reads from here this slice
// (no DB reads). Wire to real data later. See src/types/dashboard.ts.

import type { DashboardData } from "@/types/dashboard";

export const mockDashboard: DashboardData = {
  userName: "Alex",
  progressPercent: 66,
  todaysFocus: [
    {
      id: "focus-1",
      title: "Meet your team",
      subtitle: "Get to know the people you'll work with",
      duration: "30 min",
      status: "up-next",
    },
    {
      id: "focus-2",
      title: "Review architecture overview",
      subtitle: "Understand our system at a high level",
      duration: "45 min",
      status: "up-next",
    },
    {
      id: "focus-3",
      title: "Set up local environment",
      subtitle: "Install tools and verify your setup",
      duration: "60 min",
      status: "in-progress",
    },
  ],
  onboardingSteps: [
    { id: "step-1", title: "Welcome to Onboardly", status: "completed" },
    {
      id: "step-2",
      title: "Company & Product Overview",
      status: "completed",
    },
    {
      id: "step-3",
      title: "Role & Responsibilities",
      status: "in-progress",
    },
    { id: "step-4", title: "Tools & Access", status: "up-next" },
  ],
  upcoming: [
    {
      id: "event-1",
      title: "Intro with your manager",
      when: "May 16, 2024 · 10:30 AM",
      joinHref: "#",
    },
    {
      id: "event-2",
      title: "Team welcome call",
      when: "May 17, 2024 · 2:00 PM",
      joinHref: "#",
    },
  ],
  recommendedReads: [
    {
      id: "read-1",
      title: "Engineering Handbook",
      subtitle: "Our engineering principles and practices",
      href: "#",
    },
    {
      id: "read-2",
      title: "Getting Started Guide",
      subtitle: "Set up your environment and tools",
      href: "#",
    },
    {
      id: "read-3",
      title: "Product Roadmap Overview",
      subtitle: "Where we're going and why",
      href: "#",
    },
  ],
  sampleQuestion: "How do I request access to repositories?",
  recentActivity: [
    {
      id: "activity-1",
      text: 'Completed "Company & Product Overview"',
      date: "May 14, 2024",
      status: "completed",
    },
    {
      id: "activity-2",
      text: 'Started "Role & Responsibilities"',
      date: "May 14, 2024",
      status: "in-progress",
    },
  ],
};
