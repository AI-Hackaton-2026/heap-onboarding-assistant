"use client";

// Create / edit form for a project. The same form drives both flows — pass an
// existing project to prefill (edit) or omit it (create). Server-side errors
// from the action surface inline via useActionState.

import { useActionState } from "react";
import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "@/lib/projects/actions";
import type { ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ProjectFormValues {
  id: string;
  name: string;
  description: string | null;
  githubRepo: string | null;
  slackWorkspace: string | null;
  status: ProjectStatus;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SYNCING", label: "Syncing" },
  { value: "READY", label: "Ready" },
  { value: "ERROR", label: "Error" },
];

export function ProjectForm({ project }: { project?: ProjectFormValues }) {
  const isEdit = Boolean(project);
  const action = isEdit ? updateProject : createProject;
  const [state, formAction, pending] = useActionState<
    ProjectFormState,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {project ? (
        <input type="hidden" name="projectId" value={project.id} />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={project?.name ?? ""}
          placeholder="Backend Platform"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={project?.description ?? ""}
          placeholder="What this project covers and who it's for."
          rows={3}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="githubRepo">GitHub repo</Label>
          <Input
            id="githubRepo"
            name="githubRepo"
            defaultValue={project?.githubRepo ?? ""}
            placeholder="owner/repository"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slackWorkspace">Slack workspace</Label>
          <Input
            id="slackWorkspace"
            name="slackWorkspace"
            defaultValue={project?.slackWorkspace ?? ""}
            placeholder="Acme Team"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={project?.status ?? "DRAFT"}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 md:text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create project"}
        </Button>
      </div>
    </form>
  );
}
