// View-model types for the cross-project onboarding overview. The dashboard is a
// single global surface, but all underlying data (courses, lessons, progress,
// documents, chats) is project-scoped — so these shapes describe the *aggregated*
// rollup across every project the current user is an ACTIVE member of. The
// aggregation lives in src/lib/dashboard/overview.ts and is access-guarded there.

import type { StepStatus } from "@/types/dashboard";

/** The signed-in user as shown on the overview (banner greeting, etc.). */
export interface OverviewUser {
  id: string;
  /** Best-available display name; falls back to the email handle. */
  name: string;
  avatarUrl: string | null;
  email: string | null;
}

/** Aggregated onboarding progress across all of the user's projects. */
export interface OverviewProgress {
  /** Total lessons across every accessible project's course(s). */
  totalLessons: number;
  /** Lessons this user has marked COMPLETED across those projects. */
  completedLessons: number;
  /** 0–100, rounded. 0 when there are no lessons yet. */
  percent: number;
  /** The next not-completed lesson to tackle, if any. */
  nextLesson: OverviewPlanItem | null;
}

/**
 * One lesson in the user's aggregated plan, tagged with which project it belongs
 * to so the UI can deep-link into the right course.
 */
export interface OverviewPlanItem {
  /** Lesson id. */
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  /** Course/module context for grouping + subtitles. */
  courseTitle: string;
  moduleTitle: string;
  status: StepStatus;
  /** Deep link into the project course player. */
  href: string;
}

/** A document surfaced as a recommended read, with its owning project. */
export interface OverviewRead {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  /** Deep link to the project's resources/document. */
  href: string;
}

/** A single row in the aggregated recent-activity feed. */
export interface OverviewActivity {
  id: string;
  text: string;
  /** Pre-formatted date for display, e.g. "May 14, 2026". */
  date: string;
  /** ISO timestamp used only for sorting. */
  timestamp: string;
  status: StepStatus;
}

/** A project's slice of the user's plan: its lessons + that project's progress. */
export interface PlanProject {
  projectId: string;
  projectName: string;
  courseTitle: string;
  /** Lessons in course order, each tagged completed / in-progress / up-next. */
  items: OverviewPlanItem[];
  completedLessons: number;
  totalLessons: number;
  /** 0–100 for this project. */
  percent: number;
  /** Deep link into this project's course player. */
  href: string;
}

/** The full plan, grouped per project, plus an overall rollup. */
export interface PlanData {
  projects: PlanProject[];
  totalLessons: number;
  completedLessons: number;
  /** Overall 0–100 across all projects. */
  percent: number;
  /** True when the user belongs to no projects. */
  hasNoProjects: boolean;
  /** True when the user has projects but none has a course with lessons. */
  hasNoCourses: boolean;
}

/** Everything the overview page needs, aggregated across projects. */
export interface OverviewData {
  user: OverviewUser;
  progress: OverviewProgress;
  /** The next few lessons to work on (capped). */
  focus: OverviewPlanItem[];
  /** A short timeline of onboarding steps (lessons), capped. */
  steps: OverviewPlanItem[];
  /** Recommended documents to read, capped. */
  reads: OverviewRead[];
  /** Recent activity (completed lessons + uploaded docs), capped. */
  activity: OverviewActivity[];
  /** True when the user belongs to no projects at all. */
  hasNoProjects: boolean;
  /** True when the user has projects but none has a generated course yet. */
  hasNoCourses: boolean;
}
