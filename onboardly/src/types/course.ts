// Course, module, lesson, checklist, and quiz types.
// An AI-generated onboarding course is a tree: Course → Modules → Lessons → (Checklist + Quiz).

import type { UUID } from "./database";

export interface ChecklistItem {
  id: UUID;
  text: string;
  done: boolean;
}

export interface QuizQuestion {
  id: UUID;
  question: string;
  options: string[];
  /** Index into `options`. */
  correctIndex: number;
}

export interface Lesson {
  id: UUID;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  quiz: QuizQuestion[];
}

export interface Module {
  id: UUID;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: UUID;
  /** Free-text role this course was generated for, e.g. "Frontend Engineer". */
  roleName: string;
  /** Optional rough estimate, e.g. "~6 hours". */
  estimatedDuration?: string;
  modules: Module[];
}
