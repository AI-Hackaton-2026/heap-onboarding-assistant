"use client";

// Create / edit form for a project. The same form drives both flows — pass an
// existing project to prefill (edit) or omit it (create). Server-side errors
// from the action surface inline via useActionState.

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  createProject,
  loadGitHubRepoDefaults,
  updateProject,
  type ProjectFormState,
} from "@/lib/projects/actions";
import type { AvailableGitHubRepos } from "@/lib/projects/github";
import type { ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  FolderGit2,
  MessageSquare,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";

export interface ProjectFormValues {
  id: string;
  name: string;
  description: string | null;
  githubRepo: string | null;
  slackWorkspace: string | null;
  status: ProjectStatus;
}

interface ProjectFormProps {
  project?: ProjectFormValues;
  githubRepos?: AvailableGitHubRepos;
  githubAppInstallUrl?: string;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SYNCING", label: "Syncing" },
  { value: "READY", label: "Ready" },
  { value: "ERROR", label: "Error" },
];

export function ProjectForm({
  project,
  githubRepos,
  githubAppInstallUrl,
}: ProjectFormProps) {
  const isEdit = Boolean(project);
  const action = isEdit ? updateProject : createProject;
  const [state, formAction, pending] = useActionState<
    ProjectFormState,
    FormData
  >(action, undefined);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [githubRepo, setGitHubRepo] = useState(project?.githubRepo ?? "");
  const [slackWorkspace, setSlackWorkspace] = useState(
    project?.slackWorkspace ?? "",
  );
  const [repoDefaultsLoading, setRepoDefaultsLoading] = useState(false);
  const [repoDefaultsMessage, setRepoDefaultsMessage] = useState<string | null>(
    null,
  );
  const repoDefaultsRequest = useRef(0);
  const selectedGitHubRepo = githubRepos?.repos.find(
    (repo) => repo.fullName === githubRepo,
  );

  async function handleGitHubRepoChange(value: string): Promise<void> {
    setGitHubRepo(value);
    setRepoDefaultsMessage(null);
    const requestId = ++repoDefaultsRequest.current;

    if (!value) {
      setRepoDefaultsLoading(false);
      return;
    }

    setRepoDefaultsLoading(true);
    const defaults = await loadGitHubRepoDefaults(value);
    if (requestId !== repoDefaultsRequest.current) {
      return;
    }

    setRepoDefaultsLoading(false);
    if ("error" in defaults) {
      setRepoDefaultsMessage(defaults.error);
      return;
    }

    setName(defaults.name);
    setDescription(defaults.description);
    setRepoDefaultsMessage(defaults.notice ?? null);
  }

  const createConnectionFields = !isEdit ? (
    <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="font-heading flex items-center gap-2 text-sm font-semibold">
          <FolderGit2 className="text-primary size-4" />
          Connect your sources
        </h2>
        <p className="text-muted-foreground text-xs">
          Choose the repository that will seed this project&apos;s knowledge.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="githubRepo" className="flex items-center gap-1.5">
            <FolderGit2 className="size-3.5" />
            GitHub repo
          </Label>
          {githubRepos?.status === "connected" &&
          githubRepos.repos.length > 0 ? (
            <select
              id="githubRepo"
              name="githubRepo"
              value={githubRepo}
              onChange={(event) =>
                void handleGitHubRepoChange(event.target.value)
              }
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 md:text-sm"
            >
              <option value="">Select a repository (optional)</option>
              {githubRepos.repos.map((repo) => (
                <option key={repo.fullName} value={repo.fullName}>
                  {repo.fullName}
                  {repo.private ? " · Private" : ""}
                  {repo.ingestionReady
                    ? " · App installed"
                    : " · Install app for members"}
                </option>
              ))}
            </select>
          ) : (
            <select
              id="githubRepo"
              name="githubRepo"
              className="border-input dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-base md:text-sm"
              disabled
            >
              <option>
                {githubRepos?.status === "connected"
                  ? "No unlinked repositories available"
                  : "Connect GitHub to choose a repository"}
              </option>
            </select>
          )}
          {githubRepos?.status === "not-connected" ? (
            <p className="text-muted-foreground text-xs">
              <Link
                href="/login?redirectTo=/projects/new"
                className="text-primary hover:underline"
              >
                Connect GitHub
              </Link>{" "}
              to list your repositories.
            </p>
          ) : null}
          {githubRepos?.status === "error" ? (
            <p className="text-muted-foreground text-xs">
              Your GitHub session may have expired.{" "}
              <Link
                href="/login?redirectTo=/projects/new"
                className="text-primary hover:underline"
              >
                Reconnect GitHub
              </Link>
              .
            </p>
          ) : null}
          {repoDefaultsLoading ? (
            <p className="text-muted-foreground text-xs">
              Loading repository README…
            </p>
          ) : null}
          {repoDefaultsMessage ? (
            <p className="text-muted-foreground text-xs" role="status">
              {repoDefaultsMessage}
            </p>
          ) : null}
          {selectedGitHubRepo && !selectedGitHubRepo.ingestionReady ? (
            <p className="text-muted-foreground text-xs">
              This repo can be linked now, but member discovery needs the
              Onboardly GitHub App.{" "}
              {githubAppInstallUrl ? (
                <Link
                  href={githubAppInstallUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  Install the app
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slackWorkspace" className="flex items-center gap-1.5">
            <MessageSquare className="size-3.5" />
            Slack organization
          </Label>
          <select
            id="slackWorkspace"
            name="slackWorkspace"
            className="border-input dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 text-base md:text-sm"
            disabled
          >
            <option>Slack organizations coming soon</option>
          </select>
          <p className="text-muted-foreground text-xs">
            TODO: list connected Slack organizations.
          </p>
        </div>
      </div>
    </section>
  ) : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {project ? (
        <input type="hidden" name="projectId" value={project.id} />
      ) : null}

      {createConnectionFields}

      <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-heading flex items-center gap-2 text-sm font-semibold">
            <FileText className="text-primary size-4" />
            Project details
          </h2>
          <p className="text-muted-foreground text-xs">
            Give teammates a clear summary of what they are joining.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Backend Platform"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this project covers and who it's for."
            rows={5}
          />
        </div>
      </section>

      {isEdit ? (
        <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
          <div className="space-y-1">
            <h2 className="font-heading flex items-center gap-2 text-sm font-semibold">
              <FolderGit2 className="text-primary size-4" />
              Connections
            </h2>
            <p className="text-muted-foreground text-xs">
              Update the sources connected to this project.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="githubRepo" className="flex items-center gap-1.5">
                <FolderGit2 className="size-3.5" />
                GitHub repo
              </Label>
              <Input
                id="githubRepo"
                name="githubRepo"
                value={githubRepo}
                onChange={(event) => setGitHubRepo(event.target.value)}
                placeholder="owner/repository"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="slackWorkspace"
                className="flex items-center gap-1.5"
              >
                <MessageSquare className="size-3.5" />
                Slack workspace
              </Label>
              <Input
                id="slackWorkspace"
                name="slackWorkspace"
                value={slackWorkspace}
                onChange={(event) => setSlackWorkspace(event.target.value)}
                placeholder="Acme Team"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-heading flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="text-primary size-4" />
            Project status
          </h2>
          <p className="text-muted-foreground text-xs">
            Keep the lifecycle state visible to everyone on the project.
          </p>
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
      </section>

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={pending}>
          {isEdit ? (
            <Save className="size-4" />
          ) : (
            <Sparkles className="size-4" />
          )}
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
