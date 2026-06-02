// Course/module/lesson/checklist/quiz schema definitions.
// Re-exports the shared course types so course-generation code has a single
// import surface; can later hold runtime validators (e.g. Zod) for AI output.

export type {
  Course,
  Module,
  Lesson,
  ChecklistItem,
  QuizQuestion,
} from "@/types/course";
