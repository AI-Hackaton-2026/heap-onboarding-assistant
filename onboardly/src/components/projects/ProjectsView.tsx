"use client";

// Client-side presentation controls for browsing an already-loaded project list.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import type { AccessibleProject } from "@/types/member";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/members/RoleBadge";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

type ViewMode = "tiles" | "list";

interface ProjectsViewProps {
  projects: AccessibleProject[];
  initialQuery?: string;
}

export function ProjectsView({ projects, initialQuery = "" }: ProjectsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tiles");
  const [query, setQuery] = useState(initialQuery);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = useMemo(() => {
    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter(({ project }) =>
      [project.name, project.description]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery, projects]);

  return (
    <div className="space-y-4">
      <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="pr-8 pl-8"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear project search"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-sm outline-none focus-visible:ring-2"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-muted-foreground text-xs whitespace-nowrap">
            {normalizedQuery
              ? `${filteredProjects.length} of ${projects.length} projects`
              : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
          </p>
          <div
            className="border-border bg-muted/40 flex items-center rounded-lg border p-0.5"
            role="group"
            aria-label="Project view mode"
          >
            <Button
              type="button"
              variant={viewMode === "tiles" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Tile view"
              aria-pressed={viewMode === "tiles"}
              title="Tile view"
              onClick={() => setViewMode("tiles")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              title="List view"
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching projects"
          description={`No projects match "${query.trim()}". Try a different search.`}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuery("")}
            >
              Clear search
            </Button>
          }
        />
      ) : viewMode === "tiles" ? (
        <ProjectTiles projects={filteredProjects} />
      ) : (
        <ProjectList projects={filteredProjects} />
      )}
    </div>
  );
}

function ProjectTiles({ projects }: ProjectsViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(({ project, role }) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group"
        >
          <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <ProjectIcon />
                <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
              <CardTitle className="line-clamp-1">{project.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {project.description ?? "No description yet."}
              </CardDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <RoleBadge role={role} />
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ProjectList({ projects }: ProjectsViewProps) {
  return (
    <div className="space-y-2">
      {projects.map(({ project, role }) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group"
        >
          <Card
            size="sm"
            className="transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
          >
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ProjectIcon className="size-9 rounded-lg" />
              <div className="min-w-0 flex-1">
                <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {project.description ?? "No description yet."}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <ProjectStatusBadge status={project.status} />
                <RoleBadge role={role} />
                <ArrowRight className="text-muted-foreground ml-auto size-4 transition-transform group-hover:translate-x-0.5 sm:ml-1" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ProjectIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
        className,
      )}
    >
      <FolderKanban className="size-5" />
    </span>
  );
}
