// Mock projects kept for reference/sample shapes. Live surfaces (dashboard,
// projects list/detail) now read real projects from the database via Prisma.

import type { Project } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "Onboardly Demo Project",
    description: "Demo project for the AI onboarding assistant.",
    githubRepo: "heap/onboardly",
    slackWorkspace: "Heap Team",
    status: "READY",
    createdAt: "2026-06-02T09:00:00Z",
  },
];
