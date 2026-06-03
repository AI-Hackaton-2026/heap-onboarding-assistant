// Course generation — reads a GitHub repo and prompts Gemini to produce a
// structured onboarding course as JSON.

import type {
  Course,
  Module,
  Lesson,
  ChecklistItem,
  QuizQuestion,
} from "@/types/course";
import { getGemini, GEMINI_CHAT_MODEL } from "@/lib/ai/gemini";
import { fetchRepoContext } from "@/lib/github/repo-reader";

interface RawQuiz {
  question: string;
  options: string[];
  correctIndex: number;
}

interface RawLesson {
  title: string;
  content: string;
  checklist: string[];
  quiz: RawQuiz[];
}

interface RawModule {
  title: string;
  description: string;
  lessons: RawLesson[];
}

interface RawCourse {
  roleName: string;
  estimatedDuration: string;
  modules: RawModule[];
}

function buildPrompt(
  roleName: string,
  repoContext?: string,
  docsContext?: string,
): string {
  const contextSections: string[] = [];

  if (docsContext) {
    contextSections.push(`## Company Documents\n\n${docsContext}`);
  }
  if (repoContext) {
    contextSections.push(`## GitHub Repository\n\n${repoContext}`);
  }

  const contextBlock = contextSections.length > 0
    ? `Here is the knowledge base for this organisation:\n\n${contextSections.join("\n\n---\n\n")}\n\n`
    : "";

  const instruction = repoContext
    ? `Help them understand the codebase, architecture, and workflows.`
    : `Help them understand the company, their role, key processes, and how to succeed in their first weeks.`;

  return `You are an expert onboarding specialist creating a personalised onboarding course for a new ${roleName}.

${contextBlock}Generate a comprehensive onboarding course for a "${roleName}" joining this organisation. ${instruction}

Return a JSON object with this shape:
- roleName: string
- estimatedDuration: string (e.g. "~3 hours")
- modules: array of exactly 3 modules, each with:
  - title: string
  - description: string (1 sentence)
  - lessons: array of exactly 2 lessons, each with:
    - title: string
    - content: string (Markdown with 1-2 ## sections and brief prose — 80-120 words)
    - checklist: string[] (exactly 2 hands-on tasks)
    - quiz: array of exactly 1 object with: question, options (4 strings), correctIndex (0-3)

${contextSections.length > 0 ? "Base all content on the provided knowledge. Do not invent information." : "Generate practical, role-specific content based on your expertise."}`;
}

function addIds(raw: RawCourse): Course {
  return {
    id: crypto.randomUUID(),
    roleName: raw.roleName,
    estimatedDuration: raw.estimatedDuration,
    modules: raw.modules.map((m): Module => ({
      id: crypto.randomUUID(),
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l): Lesson => ({
        id: crypto.randomUUID(),
        title: l.title,
        content: l.content,
        checklist: (Array.isArray(l.checklist) ? l.checklist : []).map((text): ChecklistItem => ({
          id: crypto.randomUUID(),
          text,
          done: false,
        })),
        quiz: (Array.isArray(l.quiz) ? l.quiz : l.quiz ? [l.quiz] : []).map((q): QuizQuestion => ({
          id: crypto.randomUUID(),
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correctIndex: q.correctIndex ?? 0,
        })),
      })),
    })),
  };
}

export async function generateCourse(
  _projectId: string,
  roleName: string,
  githubRepo?: string,
  docsContext?: string,
): Promise<Course> {
  const repoContext = githubRepo?.trim()
    ? await fetchRepoContext(githubRepo.trim())
    : undefined;
  const prompt = buildPrompt(roleName, repoContext, docsContext);

  const gemini = getGemini();
  const response = await gemini.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.4,
      maxOutputTokens: 32768,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";

  let parsed: RawCourse;
  try {
    parsed = JSON.parse(text) as RawCourse;
  } catch {
    throw new Error(`Gemini returned invalid JSON. Preview: ${text.slice(0, 300)}`);
  }

  return addIds(parsed);
}
