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

/**
 * Apply admin edits to a project's existing course, diffing by ID so that
 * `LessonProgress` rows (keyed on lessonId) survive the edit. Unlike
 * `saveCourseToDb`, this never deletes-and-recreates surviving rows: it
 * updates existing modules/lessons/items in place, creates new ones, and
 * deletes only the rows that are absent from the incoming course (their
 * children + progress cascade away). Positions are re-derived from order.
 */
export async function upsertCourse(
  projectId: string,
  course: Course,
): Promise<void> {
  const existing = await prisma.course.findFirst({
    where: { projectId },
    select: {
      id: true,
      modules: {
        select: { id: true, lessons: { select: { id: true } } },
      },
    },
  });

  // No saved course yet (e.g. edited a localStorage-only course) → first write.
  if (!existing) {
    await saveCourseToDb(projectId, course);
    return;
  }

  const incomingModuleIds = new Set(course.modules.map((m) => m.id));
  const incomingLessonIds = new Set(
    course.modules.flatMap((m) => m.lessons.map((l) => l.id)),
  );

  const moduleIdsToDelete = existing.modules
    .filter((m) => !incomingModuleIds.has(m.id))
    .map((m) => m.id);
  const lessonIdsToDelete = existing.modules
    .flatMap((m) => m.lessons)
    .filter((l) => !incomingLessonIds.has(l.id))
    .map((l) => l.id);

  await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: existing.id },
      data: {
        roleName: course.roleName,
        title: course.roleName,
        description: course.estimatedDuration,
      },
    });

    // Drop removed lessons (under surviving modules) and removed modules.
    // Deleting a module cascades to its lessons, so only delete lessons that
    // live under modules that themselves survive.
    if (lessonIdsToDelete.length > 0) {
      await tx.lesson.deleteMany({ where: { id: { in: lessonIdsToDelete } } });
    }
    if (moduleIdsToDelete.length > 0) {
      await tx.module.deleteMany({ where: { id: { in: moduleIdsToDelete } } });
    }

    for (const [mi, module] of course.modules.entries()) {
      await tx.module.upsert({
        where: { id: module.id },
        create: { id: module.id, courseId: existing.id, title: module.title, position: mi },
        update: { title: module.title, position: mi },
      });

      for (const [li, lesson] of module.lessons.entries()) {
        await tx.lesson.upsert({
          where: { id: lesson.id },
          create: {
            id: lesson.id,
            moduleId: module.id,
            title: lesson.title,
            content: lesson.content,
            position: li,
          },
          update: {
            // moduleId may change when a lesson moves between modules.
            moduleId: module.id,
            title: lesson.title,
            content: lesson.content,
            position: li,
          },
        });

        // Checklist + quiz have no progress attached → safe to replace wholesale.
        await tx.checklistItem.deleteMany({ where: { lessonId: lesson.id } });
        if (lesson.checklist.length > 0) {
          await tx.checklistItem.createMany({
            data: lesson.checklist.map((c, ci) => ({
              id: c.id,
              lessonId: lesson.id,
              text: c.text,
              position: ci,
            })),
          });
        }

        await tx.quiz.deleteMany({ where: { lessonId: lesson.id } });
        if (lesson.quiz.length > 0) {
          await tx.quiz.createMany({
            data: lesson.quiz.map((q, qi) => ({
              id: q.id,
              lessonId: lesson.id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              position: qi,
            })),
          });
        }
      }
    }
  });
}
