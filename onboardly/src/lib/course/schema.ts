// Course/module/lesson/checklist/quiz schema definitions.
// Re-exports the shared course types so course-generation code has a single
// import surface, plus a runtime validator for inbound course edits.

import type {
  Course,
  Lesson,
  Module,
  QuizQuestion,
} from "@/types/course";

export type {
  Course,
  Module,
  Lesson,
  ChecklistItem,
  QuizQuestion,
} from "@/types/course";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseQuiz(value: unknown): QuizQuestion | null {
  if (!isRecord(value)) return null;
  const { id, question, options, correctIndex } = value;
  if (!isNonEmptyString(id) || typeof question !== "string") return null;
  if (
    !Array.isArray(options) ||
    options.length === 0 ||
    !options.every((o) => typeof o === "string")
  ) {
    return null;
  }
  if (
    typeof correctIndex !== "number" ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return null;
  }
  return { id, question, options, correctIndex };
}

function parseLesson(value: unknown): Lesson | null {
  if (!isRecord(value)) return null;
  const { id, title, content, checklist, quiz } = value;
  if (!isNonEmptyString(id) || typeof title !== "string") return null;
  if (typeof content !== "string") return null;

  const checklistArr = Array.isArray(checklist) ? checklist : [];
  const parsedChecklist = [];
  for (const item of checklistArr) {
    if (!isRecord(item) || !isNonEmptyString(item.id) || typeof item.text !== "string") {
      return null;
    }
    parsedChecklist.push({ id: item.id, text: item.text, done: false });
  }

  const quizArr = Array.isArray(quiz) ? quiz : [];
  const parsedQuiz = [];
  for (const q of quizArr) {
    const parsed = parseQuiz(q);
    if (!parsed) return null;
    parsedQuiz.push(parsed);
  }

  return { id, title, content, checklist: parsedChecklist, quiz: parsedQuiz };
}

function parseModule(value: unknown): Module | null {
  if (!isRecord(value)) return null;
  const { id, title, description, lessons } = value;
  if (!isNonEmptyString(id) || typeof title !== "string") return null;
  if (!Array.isArray(lessons)) return null;

  const parsedLessons = [];
  for (const lesson of lessons) {
    const parsed = parseLesson(lesson);
    if (!parsed) return null;
    parsedLessons.push(parsed);
  }

  return {
    id,
    title,
    description: typeof description === "string" ? description : "",
    lessons: parsedLessons,
  };
}

/**
 * Validate an untrusted (client) course payload for the edit `PUT`. Returns a
 * normalized `Course` on success or `null` on any structural problem; IDs must
 * be present so the upsert can diff by them. Empty titles are allowed mid-edit
 * but ids/options/correctIndex must be well-formed.
 */
export function parseCourse(value: unknown): Course | null {
  if (!isRecord(value)) return null;
  const { id, roleName, estimatedDuration, modules } = value;
  if (!isNonEmptyString(id) || typeof roleName !== "string") return null;
  if (!Array.isArray(modules)) return null;

  const parsedModules = [];
  for (const mod of modules) {
    const parsed = parseModule(mod);
    if (!parsed) return null;
    parsedModules.push(parsed);
  }

  return {
    id,
    roleName,
    estimatedDuration:
      typeof estimatedDuration === "string" ? estimatedDuration : undefined,
    modules: parsedModules,
  };
}
