// Mock projects for early frontend development (before real project CRUD exists).

import type { Project } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "Onboardly Demo Project",
    description: "Demo project for the AI onboarding assistant.",
    githubRepo: "heap/onboardly",
    slackWorkspace: "Heap Team",
    knowledgeStatus: "ready",
    createdAt: "2026-06-02T09:00:00Z",
  },
];
