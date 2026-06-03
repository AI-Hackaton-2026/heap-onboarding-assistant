// Prisma helpers for persisting and loading AI-generated courses.

import { prisma } from "@/lib/db/prisma";
import type { Course } from "@/types/course";

export async function saveCourseToDb(
  projectId: string,
  course: Course,
): Promise<void> {
  await prisma.course.deleteMany({ where: { projectId } });

  await prisma.course.create({
    data: {
      id: course.id,
      projectId,
      roleName: course.roleName,
      title: course.roleName,
      description: course.estimatedDuration,
      modules: {
        create: course.modules.map((m, mi) => ({
          id: m.id,
          title: m.title,
          position: mi,
          lessons: {
            create: m.lessons.map((l, li) => ({
              id: l.id,
              title: l.title,
              content: l.content,
              position: li,
              checklistItems: {
                create: l.checklist.map((c, ci) => ({
                  id: c.id,
                  text: c.text,
                  position: ci,
                })),
              },
              quizzes: {
                create: l.quiz.map((q, qi) => ({
                  id: q.id,
                  question: q.question,
                  options: q.options,
                  correctIndex: q.correctIndex,
                  position: qi,
                })),
              },
            })),
          },
        })),
      },
    },
  });
}

export async function loadCourseFromDb(
  projectId: string,
): Promise<Course | null> {
  const dbCourse = await prisma.course.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            include: {
              checklistItems: { orderBy: { position: "asc" } },
              quizzes: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!dbCourse) return null;

  return {
    id: dbCourse.id,
    roleName: dbCourse.roleName,
    estimatedDuration: dbCourse.description ?? undefined,
    modules: dbCourse.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: "",
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content ?? "",
        checklist: l.checklistItems.map((c) => ({
          id: c.id,
          text: c.text,
          done: false,
        })),
        quiz: l.quizzes.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options as string[],
          correctIndex: q.correctIndex,
        })),
      })),
    })),
  };
}

export async function deleteCourseFromDb(projectId: string): Promise<void> {
  await prisma.course.deleteMany({ where: { projectId } });
}
