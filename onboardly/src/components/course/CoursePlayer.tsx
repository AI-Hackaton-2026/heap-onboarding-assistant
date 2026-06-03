"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Course, Lesson, Module } from "@/types/course";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Loader2,
  Sparkles,
  BookOpen,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/Markdown";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

// ── Edit helpers ──────────────────────────────────────────────────────────────

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function newLesson(): Lesson {
  return {
    id: crypto.randomUUID(),
    title: "New lesson",
    content: "",
    checklist: [],
    quiz: [],
  };
}

function newModule(): Module {
  return {
    id: crypto.randomUUID(),
    title: "New module",
    description: "",
    lessons: [newLesson()],
  };
}

// ── Generate Form ─────────────────────────────────────────────────────────────

interface GenerateFormProps {
  projectId: string;
  initialRepo?: string;
  onCourseReady: (course: Course) => void;
}

function GenerateForm({ projectId, initialRepo, onCourseReady }: GenerateFormProps) {
  const [role, setRole] = useState("");
  const [repo, setRepo] = useState(initialRepo ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const trimmedRole = role.trim();
    if (!trimmedRole) return;

    const trimmedRepo = repo.trim();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/course/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          roleName: trimmedRole,
          ...(trimmedRepo ? { githubRepo: trimmedRepo } : {}),
        }),
      });
      const data = (await res.json()) as Course & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      onCourseReady(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Generation failed — try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col gap-6">
      <PageHeader
        title="Onboarding course"
        subtitle="Generate a guided learning path personalised for your role."
        icon={BookOpen}
      />
      <Card className="relative mx-auto w-full max-w-lg shadow-sm">
        {loading ? (
          <div
            className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[inherit] backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="text-primary size-10 animate-spin" />
            <p className="text-sm font-medium">Generating your course…</p>
            <p className="text-muted-foreground max-w-xs text-center text-xs">
              This usually takes 30–90 seconds. Keep this tab open.
            </p>
          </div>
        ) : null}

        <CardContent className="space-y-6 py-4 sm:py-6">
          <div className="space-y-2 text-center">
            <div className="bg-primary/10 mx-auto flex size-12 items-center justify-center rounded-2xl">
              <Sparkles className="text-primary h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl font-semibold">
              Generate your onboarding course
            </h2>
            <p className="text-muted-foreground text-sm">
              Gemini uses your company&apos;s knowledge base to build a
              personalised course for your role.
            </p>
          </div>

          <div className="space-y-4" aria-busy={loading}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="role-input">
                Your role
              </label>
              <Input
                id="role-input"
                placeholder="e.g. Frontend Engineer, Backend Developer"
                value={role}
                disabled={loading}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="repo-input">
                GitHub repository{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="repo-input"
                placeholder="owner/repo — leave blank to use uploaded docs only"
                value={repo}
                disabled={loading}
                onChange={(e) => setRepo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
              />
              <p className="text-muted-foreground text-xs">
                Leave blank if your knowledge base comes from uploaded documents.
              </p>
            </div>

            {error ? (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive flex gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <Button
              className="w-full"
              onClick={generate}
              disabled={loading || !role.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating course…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generate Course
                </>
              )}
            </Button>
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

// ── Course Editor (admin-only) ──────────────────────────────────────────────────

interface CourseEditorProps {
  course: Course;
  saving: boolean;
  error: string | null;
  onSave: (next: Course) => void;
  onCancel: () => void;
}

function CourseEditor({ course, saving, error, onSave, onCancel }: CourseEditorProps) {
  const [draft, setDraft] = useState<Course>(course);

  const updateModule = (mi: number, patch: Partial<Module>) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)),
    }));

  const updateLesson = (mi: number, li: number, patch: Partial<Lesson>) =>
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, i) =>
        i === mi
          ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) }
          : m,
      ),
    }));

  const moveModule = (mi: number, dir: -1 | 1) =>
    setDraft((d) => ({ ...d, modules: moveItem(d.modules, mi, mi + dir) }));

  const deleteModule = (mi: number) =>
    setDraft((d) => ({ ...d, modules: d.modules.filter((_, i) => i !== mi) }));

  const addModule = () =>
    setDraft((d) => ({ ...d, modules: [...d.modules, newModule()] }));

  const moveLesson = (mi: number, li: number, dir: -1 | 1) =>
    updateModule(mi, { lessons: moveItem(draft.modules[mi].lessons, li, li + dir) });

  const deleteLesson = (mi: number, li: number) =>
    updateModule(mi, { lessons: draft.modules[mi].lessons.filter((_, j) => j !== li) });

  const addLesson = (mi: number) =>
    updateModule(mi, { lessons: [...draft.modules[mi].lessons, newLesson()] });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="border-border bg-background/95 sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="font-heading text-xl font-semibold">Edit course</h1>
          <p className="text-muted-foreground text-sm">
            Changes are saved for everyone on this project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(draft)} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="course-role">
          Role
        </label>
        <Input
          id="course-role"
          value={draft.roleName}
          onChange={(e) => setDraft((d) => ({ ...d, roleName: e.target.value }))}
        />
      </div>

      {draft.modules.map((module, mi) => (
        <Card key={module.id} className="shadow-sm">
          <CardContent className="space-y-4 py-4">
            <div className="flex items-start gap-2">
              <Input
                aria-label="Module title"
                value={module.title}
                onChange={(e) => updateModule(mi, { title: e.target.value })}
                className="font-medium"
              />
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move module up"
                  disabled={mi === 0}
                  onClick={() => moveModule(mi, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move module down"
                  disabled={mi === draft.modules.length - 1}
                  onClick={() => moveModule(mi, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete module"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteModule(mi)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 sm:pl-3">
              {module.lessons.map((lesson, li) => (
                <div
                  key={lesson.id}
                  className="border-border bg-muted/20 space-y-3 rounded-lg border p-3"
                >
                  <div className="flex items-start gap-2">
                    <Input
                      aria-label="Lesson title"
                      value={lesson.title}
                      onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                    />
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Move lesson up"
                        disabled={li === 0}
                        onClick={() => moveLesson(mi, li, -1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Move lesson down"
                        disabled={li === module.lessons.length - 1}
                        onClick={() => moveLesson(mi, li, 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete lesson"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteLesson(mi, li)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground text-xs font-medium">
                      Content (Markdown)
                    </label>
                    <Textarea
                      value={lesson.content}
                      onChange={(e) => updateLesson(mi, li, { content: e.target.value })}
                      rows={5}
                    />
                  </div>

                  <LessonChecklistEditor
                    lesson={lesson}
                    onChange={(checklist) => updateLesson(mi, li, { checklist })}
                  />
                  <LessonQuizEditor
                    lesson={lesson}
                    onChange={(quiz) => updateLesson(mi, li, { quiz })}
                  />
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={() => addLesson(mi)}>
                <Plus className="mr-1 h-4 w-4" />
                Add lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addModule}>
        <Plus className="mr-1 h-4 w-4" />
        Add module
      </Button>
    </div>
  );
}

function LessonChecklistEditor({
  lesson,
  onChange,
}: {
  lesson: Lesson;
  onChange: (checklist: Lesson["checklist"]) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-muted-foreground text-xs font-medium">Checklist</label>
      {lesson.checklist.map((item, ci) => (
        <div key={item.id} className="flex items-center gap-2">
          <Input
            aria-label="Checklist item"
            value={item.text}
            onChange={(e) =>
              onChange(
                lesson.checklist.map((c, i) =>
                  i === ci ? { ...c, text: e.target.value } : c,
                ),
              )
            }
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove checklist item"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onChange(lesson.checklist.filter((_, i) => i !== ci))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange([
            ...lesson.checklist,
            { id: crypto.randomUUID(), text: "", done: false },
          ])
        }
      >
        <Plus className="mr-1 h-4 w-4" />
        Add checklist item
      </Button>
    </div>
  );
}

function LessonQuizEditor({
  lesson,
  onChange,
}: {
  lesson: Lesson;
  onChange: (quiz: Lesson["quiz"]) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-muted-foreground text-xs font-medium">Quiz</label>
      {lesson.quiz.map((q, qi) => {
        const patchQuestion = (patch: Partial<(typeof lesson.quiz)[number]>) =>
          onChange(lesson.quiz.map((x, i) => (i === qi ? { ...x, ...patch } : x)));
        return (
          <div key={q.id} className="border-border space-y-2 rounded-md border p-2.5">
            <div className="flex items-start gap-2">
              <Input
                aria-label="Quiz question"
                value={q.question}
                onChange={(e) => patchQuestion({ question: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove quiz question"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onChange(lesson.quiz.filter((_, i) => i !== qi))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctIndex === oi}
                    onChange={() => patchQuestion({ correctIndex: oi })}
                    aria-label={`Mark option ${oi + 1} correct`}
                    className="accent-primary h-4 w-4 shrink-0 cursor-pointer"
                  />
                  <Input
                    aria-label={`Option ${oi + 1}`}
                    value={opt}
                    onChange={(e) =>
                      patchQuestion({
                        options: q.options.map((o, i) => (i === oi ? e.target.value : o)),
                      })
                    }
                  />
                  {q.options.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove option ${oi + 1}`}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() =>
                        patchQuestion({
                          options: q.options.filter((_, i) => i !== oi),
                          correctIndex:
                            q.correctIndex > oi
                              ? q.correctIndex - 1
                              : Math.min(q.correctIndex, q.options.length - 2),
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </label>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => patchQuestion({ options: [...q.options, ""] })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add option
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange([
            ...lesson.quiz,
            {
              id: crypto.randomUUID(),
              question: "",
              options: ["", ""],
              correctIndex: 0,
            },
          ])
        }
      >
        <Plus className="mr-1 h-4 w-4" />
        Add question
      </Button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface CoursePlayerProps {
  projectId: string;
  initialRepo?: string;
  initialCourse?: Course;
  isAdmin?: boolean;
}

const COURSE_STORAGE_KEY = (projectId: string) => `onboardly-course-${projectId}`;
const PROGRESS_STORAGE_KEY = (courseId: string) => `onboardly-progress-${courseId}`;

function loadCourseFromStorage(projectId: string): Course | null {
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEY(projectId));
    return raw ? (JSON.parse(raw) as Course) : null;
  } catch {
    return null;
  }
}

function loadProgressFromStorage(courseId: string): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY(courseId));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function CoursePlayer({
  projectId,
  initialRepo,
  initialCourse,
  isAdmin = false,
}: CoursePlayerProps) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(() => {
    if (initialCourse) return initialCourse;
    if (typeof window !== "undefined") return loadCourseFromStorage(projectId);
    return null;
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = initialCourse ?? loadCourseFromStorage(projectId);
    return saved ? loadProgressFromStorage(saved.id) : new Set();
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  // Persist course content to localStorage whenever it changes
  useEffect(() => {
    if (!course) return;
    localStorage.setItem(COURSE_STORAGE_KEY(projectId), JSON.stringify(course));
  }, [course, projectId]);

  // Fetch DB progress whenever a course is loaded; fall back to localStorage
  useEffect(() => {
    if (!course) return;
    fetch(`/api/course/${projectId}/progress`)
      .then((r) => r.json())
      .then((data: { completedLessonIds?: string[] }) => {
        if (data.completedLessonIds?.length) {
          setCompletedLessons(new Set(data.completedLessonIds));
        } else {
          const saved = localStorage.getItem(PROGRESS_STORAGE_KEY(course.id));
          if (saved) {
            try { setCompletedLessons(new Set(JSON.parse(saved) as string[])); } catch { /* ignore */ }
          }
        }
      })
      .catch(() => {
        const saved = localStorage.getItem(PROGRESS_STORAGE_KEY(course.id));
        if (saved) {
          try { setCompletedLessons(new Set(JSON.parse(saved) as string[])); } catch { /* ignore */ }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, projectId]);

  // Keep progress in localStorage as a session-level cache
  useEffect(() => {
    if (!course) return;
    localStorage.setItem(PROGRESS_STORAGE_KEY(course.id), JSON.stringify([...completedLessons]));
  }, [course, completedLessons]);

  const resetCourse = useCallback(async () => {
    await fetch(`/api/course/${projectId}`, { method: "DELETE" });
    localStorage.removeItem(COURSE_STORAGE_KEY(projectId));
    if (course) localStorage.removeItem(PROGRESS_STORAGE_KEY(course.id));
    setCourse(null);
    setCurrentModuleIdx(0);
    setCurrentLessonIdx(0);
    setCompletedLessons(new Set());
    setCheckedItems({});
    setQuizAnswers({});
  }, [projectId, course]);

  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap((m, mi) =>
      m.lessons.map((l, li) => ({ moduleIdx: mi, lessonIdx: li, lessonId: l.id })),
    );
  }, [course]);

  const currentFlatIdx = allLessons.findIndex(
    (l) => l.moduleIdx === currentModuleIdx && l.lessonIdx === currentLessonIdx,
  );

  const hasPrev = currentFlatIdx > 0;
  const hasNext = currentFlatIdx < allLessons.length - 1;

  const saveProgress = useCallback(
    (lessonId: string) => {
      fetch(`/api/course/${projectId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      }).catch(() => { /* non-blocking */ });
    },
    [projectId],
  );

  const goNext = useCallback(() => {
    if (!course) return;
    const currentLesson = course.modules[currentModuleIdx].lessons[currentLessonIdx];
    setCompletedLessons((prev) => new Set([...prev, currentLesson.id]));
    saveProgress(currentLesson.id);

    if (hasNext) {
      const next = allLessons[currentFlatIdx + 1];
      setCurrentModuleIdx(next.moduleIdx);
      setCurrentLessonIdx(next.lessonIdx);
      setQuizAnswers({});
    } else {
      router.push(`/projects/${projectId}/course/completed`);
    }
  }, [
    course,
    currentModuleIdx,
    currentLessonIdx,
    hasNext,
    allLessons,
    currentFlatIdx,
    saveProgress,
    projectId,
    router,
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
    setCourse(newCourse);
  }, []);

  const handleSaveEdits = useCallback(
    async (next: Course) => {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`/api/course/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Save failed");
        }
        setCourse(next);
        setEditing(false);
        // Keep the viewer in bounds if modules/lessons were removed.
        setCurrentModuleIdx(0);
        setCurrentLessonIdx(0);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [projectId],
  );

  if (!course) {
    return (
      <GenerateForm
        projectId={projectId}
        initialRepo={initialRepo}
        onCourseReady={handleCourseReady}
      />
    );
  }

  if (editing) {
    return (
      <div
        className="-mx-4 -my-5 overflow-y-auto px-4 py-6 sm:-mx-6 sm:-my-6 sm:px-6 md:px-10 md:py-8"
        style={{ height: "calc(100dvh - 4rem)" }}
      >
        <CourseEditor
          course={course}
          saving={saving}
          error={saveError}
          onSave={handleSaveEdits}
          onCancel={() => {
            setEditing(false);
            setSaveError(null);
          }}
        />
      </div>
    );
  }

  const currentLesson: Lesson = course.modules[currentModuleIdx].lessons[currentLessonIdx];
  const isLastLesson = !hasNext;

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

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-muted-foreground text-xs">
              {currentFlatIdx + 1} / {allLessons.length}
            </span>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    setSaveError(null);
                    setEditing(true);
                  }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] underline-offset-2 hover:underline"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
              <button
                onClick={resetCourse}
                className="text-muted-foreground hover:text-foreground text-[11px] underline-offset-2 hover:underline"
              >
                Regenerate
              </button>
            </div>
          </div>

          <Button size="sm" onClick={goNext}>
            {isLastLesson ? (
              <>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Complete
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
