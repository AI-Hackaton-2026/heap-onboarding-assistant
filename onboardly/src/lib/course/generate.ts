// Placeholder course generation helper.
// Future responsibility:
//   Take a role + the project knowledge base/graph → prompt Gemini to produce
//   modules, lessons, checklists, and quizzes → validate + store the course.

import type { Course } from "@/types/course";

export async function generateCourse(
  _projectId: string,
  _roleName: string,
): Promise<Course> {
  throw new Error("Course generation not implemented yet");
}
