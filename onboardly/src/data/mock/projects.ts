// Mock projects for early frontend development (before real project CRUD exists).
// The ID matches the demo seed in prisma/seed.ts — run `npm run db:seed` once
// to create the corresponding row in Supabase.

import type { Project } from "@/types/project";

export const DEMO_PROJECT_ID = "bbbbbbbb-0000-0000-0000-000000000001";

export const mockProjects: Project[] = [
  {
    id: DEMO_PROJECT_ID,
    name: "Onboardly Demo Project",
    description: "Demo project for the AI onboarding assistant.",
    githubRepo: "heap/onboardly",
    slackWorkspace: "Heap Team",
    knowledgeStatus: "ready",
    createdAt: "2026-06-02T09:00:00Z",
  },
];
