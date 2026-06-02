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

function buildPrompt(roleName: string, repoContext: string): string {
  return `You are an expert technical trainer creating an onboarding course for a new ${roleName}.

Below is content from the GitHub repository this person will work with:

${repoContext}

Generate a comprehensive onboarding course for a "${roleName}" joining this project. Help them understand the codebase, architecture, and workflows.

Return ONLY valid JSON with this exact structure — no markdown fences, no explanation outside the JSON:
{
  "roleName": "${roleName}",
  "estimatedDuration": "<e.g. ~4 hours>",
  "modules": [
    {
      "title": "<module title>",
      "description": "<1-2 sentence summary>",
      "lessons": [
        {
          "title": "<lesson title>",
          "content": "<rich Markdown with ## headings, prose, and code blocks — minimum 200 words>",
          "checklist": ["<actionable hands-on task 1>", "<actionable hands-on task 2>"],
          "quiz": [
            {
              "question": "<specific question about this lesson>",
              "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
              "correctIndex": 0
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- 3-5 modules, each with 2-4 lessons
- Each lesson's content must be substantial Markdown with headings, explanations, and code examples where relevant
- Checklist tasks must be hands-on (clone the repo, run a command, read a specific file, etc.)
- Each lesson has exactly 1 quiz question with 4 options and the correct answer index (0-3)
- Base all content on the actual repository files provided — do not invent functionality
- Return ONLY the JSON object`;
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
        checklist: l.checklist.map((text): ChecklistItem => ({
          id: crypto.randomUUID(),
          text,
          done: false,
        })),
        quiz: l.quiz.map((q): QuizQuestion => ({
          id: crypto.randomUUID(),
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
        })),
      })),
    })),
  };
}

export async function generateCourse(
  _projectId: string,
  roleName: string,
  githubRepo: string,
): Promise<Course> {
  const repoContext = await fetchRepoContext(githubRepo);
  const prompt = buildPrompt(roleName, repoContext);

  const gemini = getGemini();
  const response = await gemini.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  });

  const text = response.text ?? "";
  // Strip accidental markdown code fences
  const json = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: RawCourse;
  try {
    parsed = JSON.parse(json) as RawCourse;
  } catch {
    throw new Error(`Gemini returned invalid JSON. Preview: ${text.slice(0, 300)}`);
  }

  return addIds(parsed);
}
