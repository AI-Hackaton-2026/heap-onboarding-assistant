// Mock generated course data for building the course UI before real generation exists.

import type { Course } from "@/types/course";

export const mockCourse: Course = {
  id: "course-1",
  roleName: "Frontend Engineer",
  estimatedDuration: "~6 hours",
  modules: [
    {
      id: "module-1",
      title: "Project Overview",
      description: "Understand what the product does and how the team works.",
      lessons: [
        {
          id: "lesson-1",
          title: "Welcome to the project",
          content:
            "This lesson introduces the product, team structure, and first steps.",
          checklist: [
            { id: "chk-1", text: "Read the project README", done: false },
            {
              id: "chk-2",
              text: "Join the frontend Slack channel",
              done: false,
            },
            {
              id: "chk-3",
              text: "Set up the local development environment",
              done: false,
            },
          ],
          quiz: [
            {
              id: "quiz-1",
              question: "Where do you find the team's branching strategy?",
              options: ["In Slack DMs", "In the project README", "Nowhere"],
              correctIndex: 1,
            },
          ],
        },
      ],
    },
  ],
};
