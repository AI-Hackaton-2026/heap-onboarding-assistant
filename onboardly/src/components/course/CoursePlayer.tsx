"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Course, Lesson } from "@/types/course";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/Markdown";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

// ── Generate Form ─────────────────────────────────────────────────────────────

interface GenerateFormProps {
  projectId: string;
  onCourseReady: (course: Course) => void;
}

function GenerateForm({ projectId, onCourseReady }: GenerateFormProps) {
  const [role, setRole] = useState("");
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!role.trim() || !repo.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/course/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, roleName: role, githubRepo: repo }),
      });
      const data = (await res.json()) as Course & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      onCourseReady(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col gap-6">
      <PageHeader
        title="Onboarding course"
        subtitle="Generate a guided learning path grounded in this project's repository."
        icon={BookOpen}
      />
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardContent className="space-y-6 py-4 sm:py-6">
          <div className="space-y-2 text-center">
            <div className="bg-primary/10 mx-auto flex size-12 items-center justify-center rounded-2xl">
              <Sparkles className="text-primary h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl font-semibold">
              Generate your onboarding course
            </h2>
            <p className="text-muted-foreground text-sm">
              Gemini reads your GitHub repo and builds a personalised course for
              your role.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="role-input">
                Your role
              </label>
              <Input
                id="role-input"
                placeholder="e.g. Frontend Engineer, Backend Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="repo-input">
                GitHub repository
              </label>
              <Input
                id="repo-input"
                placeholder="owner/repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
              <p className="text-muted-foreground text-xs">
                Format: owner/repo
              </p>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button
              className="w-full"
              onClick={generate}
              disabled={loading || !role.trim() || !repo.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating course…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Course
                </>
              )}
            </Button>

            {loading && (
              <p className="text-muted-foreground text-center text-xs">
                Reading the repo and generating your course — this takes ~20–40
                s
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Course Sidebar ────────────────────────────────────────────────────────────

interface CourseSidebarProps {
  course: Course;
  currentModuleIdx: number;
  currentLessonIdx: number;
  completedLessons: Set<string>;
  onSelectLesson: (moduleIdx: number, lessonIdx: number) => void;
}

function CourseSidebar({
  course,
  currentModuleIdx,
  currentLessonIdx,
  completedLessons,
  onSelectLesson,
}: CourseSidebarProps) {
  return (
    <aside className="border-border bg-sidebar hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-r md:flex">
      <div className="border-border border-b px-5 py-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Onboarding Course
        </p>
        <h2 className="font-heading mt-0.5 text-sm leading-snug font-semibold">
          {course.roleName}
        </h2>
        {course.estimatedDuration && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {course.estimatedDuration}
          </Badge>
        )}
      </div>

      <nav className="flex-1 px-3 py-3">
        {course.modules.map((module, mi) => (
          <div key={module.id} className="mb-5">
            <p className="text-muted-foreground mb-1.5 px-2 text-xs font-semibold tracking-wider uppercase">
              {module.title}
            </p>
            <div className="space-y-0.5">
              {module.lessons.map((lesson, li) => {
                const isActive =
                  mi === currentModuleIdx && li === currentLessonIdx;
                const isDone = completedLessons.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(mi, li)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="text-success mt-0.5 h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Circle
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    )}
                    <span className="leading-snug">{lesson.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function MobileLessonSelect({
  course,
  currentModuleIdx,
  currentLessonIdx,
  onSelectLesson,
}: {
  course: Course;
  currentModuleIdx: number;
  currentLessonIdx: number;
  onSelectLesson: (moduleIdx: number, lessonIdx: number) => void;
}) {
  return (
    <div className="border-border bg-background border-b p-3 md:hidden">
      <label
        htmlFor="mobile-lesson-select"
        className="text-muted-foreground mb-1.5 block text-xs font-medium tracking-wide uppercase"
      >
        Lesson
      </label>
      <select
        id="mobile-lesson-select"
        value={`${currentModuleIdx}:${currentLessonIdx}`}
        onChange={(event) => {
          const [moduleIdx, lessonIdx] = event.target.value
            .split(":")
            .map(Number);
          onSelectLesson(moduleIdx, lessonIdx);
        }}
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
      >
        {course.modules.flatMap((module, moduleIdx) =>
          module.lessons.map((lesson, lessonIdx) => (
            <option
              key={lesson.id}
              value={`${moduleIdx}:${lessonIdx}`}
            >{`${module.title} · ${lesson.title}`}</option>
          )),
        )}
      </select>
    </div>
  );
}

// ── Lesson View ───────────────────────────────────────────────────────────────

interface LessonViewProps {
  lesson: Lesson;
  checkedItems: Record<string, boolean>;
  onCheckItem: (id: string, checked: boolean) => void;
  quizAnswer: number | null;
  onAnswerQuiz: (idx: number) => void;
}

function LessonView({
  lesson,
  checkedItems,
  onCheckItem,
  quizAnswer,
  onAnswerQuiz,
}: LessonViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-heading text-3xl font-semibold">{lesson.title}</h1>

      <Markdown>{lesson.content}</Markdown>

      {lesson.checklist.length > 0 && (
        <div className="border-border bg-muted/30 rounded-xl border p-6">
          <h3 className="font-heading mb-4 text-sm font-semibold tracking-wide uppercase">
            Checklist
          </h3>
          <ul className="space-y-3">
            {lesson.checklist.map((item) => {
              const checked = checkedItems[item.id] ?? false;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`chk-${item.id}`}
                    checked={checked}
                    onChange={(e) => onCheckItem(item.id, e.target.checked)}
                    className="border-border accent-primary mt-0.5 h-4 w-4 cursor-pointer rounded"
                  />
                  <label
                    htmlFor={`chk-${item.id}`}
                    className={cn(
                      "cursor-pointer text-sm leading-snug",
                      checked && "text-muted-foreground line-through",
                    )}
                  >
                    {item.text}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {lesson.quiz.length > 0 && (
        <div className="border-border rounded-xl border p-6">
          <h3 className="font-heading mb-4 text-sm font-semibold tracking-wide uppercase">
            Knowledge Check
          </h3>
          {lesson.quiz.map((q) => {
            const revealed = quizAnswer !== null;
            return (
              <div key={q.id} className="space-y-3">
                <p className="text-sm font-medium">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((option, idx) => {
                    const isSelected = quizAnswer === idx;
                    const isCorrect = idx === q.correctIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => !revealed && onAnswerQuiz(idx)}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                          !revealed &&
                            "border-border hover:border-primary hover:bg-accent cursor-pointer",
                          revealed &&
                            isCorrect &&
                            "border-success bg-success/10",
                          revealed &&
                            isSelected &&
                            !isCorrect &&
                            "border-destructive bg-destructive/10",
                          revealed &&
                            !isSelected &&
                            !isCorrect &&
                            "border-border text-muted-foreground cursor-default opacity-60",
                        )}
                      >
                        <span>{option}</span>
                        {revealed && isCorrect && (
                          <span className="text-success ml-2 font-medium">
                            ✓
                          </span>
                        )}
                        {revealed && isSelected && !isCorrect && (
                          <span className="text-destructive ml-2 font-medium">
                            ✗
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {revealed && (
                  <p
                    className={cn(
                      "text-xs",
                      quizAnswer === q.correctIndex
                        ? "text-success"
                        : "text-muted-foreground",
                    )}
                  >
                    {quizAnswer === q.correctIndex
                      ? "Correct!"
                      : `Correct answer: ${q.options[q.correctIndex]}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface CoursePlayerProps {
  projectId: string;
}

export function CoursePlayer({ projectId }: CoursePlayerProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  // Persist completed lessons to localStorage whenever they change
  useEffect(() => {
    if (!course) return;
    localStorage.setItem(
      `course-${course.id}`,
      JSON.stringify([...completedLessons]),
    );
  }, [course, completedLessons]);

  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap((m, mi) =>
      m.lessons.map((l, li) => ({
        moduleIdx: mi,
        lessonIdx: li,
        lessonId: l.id,
      })),
    );
  }, [course]);

  const currentFlatIdx = allLessons.findIndex(
    (l) => l.moduleIdx === currentModuleIdx && l.lessonIdx === currentLessonIdx,
  );

  const hasPrev = currentFlatIdx > 0;
  const hasNext = currentFlatIdx < allLessons.length - 1;

  const goNext = useCallback(() => {
    if (!course) return;
    const currentLesson =
      course.modules[currentModuleIdx].lessons[currentLessonIdx];
    setCompletedLessons((prev) => new Set([...prev, currentLesson.id]));
    if (hasNext) {
      const next = allLessons[currentFlatIdx + 1];
      setCurrentModuleIdx(next.moduleIdx);
      setCurrentLessonIdx(next.lessonIdx);
      setQuizAnswers({});
    }
  }, [
    course,
    currentModuleIdx,
    currentLessonIdx,
    hasNext,
    allLessons,
    currentFlatIdx,
  ]);

  const goPrev = useCallback(() => {
    if (!hasPrev) return;
    const prev = allLessons[currentFlatIdx - 1];
    setCurrentModuleIdx(prev.moduleIdx);
    setCurrentLessonIdx(prev.lessonIdx);
    setQuizAnswers({});
  }, [hasPrev, allLessons, currentFlatIdx]);

  const handleSelectLesson = useCallback((mi: number, li: number) => {
    setCurrentModuleIdx(mi);
    setCurrentLessonIdx(li);
    setQuizAnswers({});
  }, []);

  const handleCourseReady = useCallback((newCourse: Course) => {
    // Hydrate progress from localStorage when a course first loads
    const saved = localStorage.getItem(`course-${newCourse.id}`);
    if (saved) {
      try {
        setCompletedLessons(new Set(JSON.parse(saved) as string[]));
      } catch {
        // ignore malformed data
      }
    }
    setCourse(newCourse);
  }, []);

  if (!course) {
    return (
      <GenerateForm projectId={projectId} onCourseReady={handleCourseReady} />
    );
  }

  const currentLesson: Lesson =
    course.modules[currentModuleIdx].lessons[currentLessonIdx];
  const isLastLesson = !hasNext;
  const isCurrentDone = completedLessons.has(currentLesson.id);

  return (
    <div
      className="-mx-4 -my-5 flex overflow-hidden sm:-mx-6 sm:-my-6"
      style={{ height: "calc(100dvh - 4rem)" }}
    >
      <CourseSidebar
        course={course}
        currentModuleIdx={currentModuleIdx}
        currentLessonIdx={currentLessonIdx}
        completedLessons={completedLessons}
        onSelectLesson={handleSelectLesson}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileLessonSelect
          course={course}
          currentModuleIdx={currentModuleIdx}
          currentLessonIdx={currentLessonIdx}
          onSelectLesson={handleSelectLesson}
        />
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-10 md:py-8">
          <LessonView
            lesson={currentLesson}
            checkedItems={checkedItems}
            onCheckItem={(id, checked) =>
              setCheckedItems((prev) => ({ ...prev, [id]: checked }))
            }
            quizAnswer={quizAnswers[currentLesson.id] ?? null}
            onAnswerQuiz={(idx) =>
              setQuizAnswers((prev) => ({ ...prev, [currentLesson.id]: idx }))
            }
          />
        </div>

        <div className="border-border bg-background flex items-center justify-between gap-2 border-t px-4 py-3 sm:px-6 md:px-10">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={!hasPrev}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <span className="text-muted-foreground text-xs">
            {currentFlatIdx + 1} / {allLessons.length}
          </span>

          <Button
            size="sm"
            onClick={goNext}
            disabled={isLastLesson && isCurrentDone}
          >
            {isLastLesson ? (
              <>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {isCurrentDone ? "Course complete" : "Complete"}
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
