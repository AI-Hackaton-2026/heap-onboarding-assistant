"use client";

// Client-side browsing controls for an already-loaded GitHub repository list.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  FolderGit2,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import type { GitHubRepo } from "@/lib/github/oauth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

type ViewMode = "tiles" | "list";
type RepoScope = "all" | "mine" | "public" | "private";
type RepoSort = "updated" | "name" | "owner";

interface RepositoriesViewProps {
  repos: GitHubRepo[];
  currentGitHubLogin: string | null;
}

const SCOPE_LABELS: Record<RepoScope, string> = {
  all: "All repos",
  mine: "My repos",
  public: "Public",
  private: "Private",
};

export function RepositoriesView({
  repos,
  currentGitHubLogin,
}: RepositoriesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tiles");
  const [scope, setScope] = useState<RepoScope>("all");
  const [sort, setSort] = useState<RepoSort>("updated");
  const [owner, setOwner] = useState("all");
  const [query, setQuery] = useState("");

  const owners = useMemo(
    () =>
      Array.from(new Set(repos.map((repo) => repo.ownerLogin))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [repos],
  );

  const filteredRepos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLogin = currentGitHubLogin?.toLowerCase() ?? null;

    return repos
      .filter((repo) => {
        if (scope === "mine") {
          return repo.ownerLogin.toLowerCase() === normalizedLogin;
        }
        if (scope === "public") {
          return !repo.private;
        }
        if (scope === "private") {
          return repo.private;
        }
        return true;
      })
      .filter((repo) => owner === "all" || repo.ownerLogin === owner)
      .filter((repo) => {
        if (!normalizedQuery) {
          return true;
        }

        return [repo.fullName, repo.description, repo.language, repo.ownerLogin]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sort === "owner") {
          return (
            a.ownerLogin.localeCompare(b.ownerLogin) ||
            a.name.localeCompare(b.name)
          );
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [currentGitHubLogin, owner, query, repos, scope, sort]);

  const hasFilters =
    query.trim().length > 0 ||
    scope !== "all" ||
    owner !== "all" ||
    sort !== "updated";

  function clearFilters() {
    setQuery("");
    setScope("all");
    setOwner("all");
    setSort("updated");
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search repositories..."
                aria-label="Search repositories"
                className="pr-8 pl-8"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear repository search"
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-sm outline-none focus-visible:ring-2"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:ml-auto">
              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="shrink-0">Owner</span>
                <select
                  value={owner}
                  onChange={(event) => {
                    const value = event.target.value;
                    setOwner(value);
                    if (
                      scope === "mine" &&
                      value !== "all" &&
                      value.toLowerCase() !== currentGitHubLogin?.toLowerCase()
                    ) {
                      setScope("all");
                    }
                  }}
                  aria-label="Filter repositories by owner"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 min-w-0 flex-1 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-3 sm:w-40"
                >
                  <option value="all">All owners</option>
                  {owners.map((login) => (
                    <option key={login} value={login}>
                      {login}
                      {login.toLowerCase() === currentGitHubLogin?.toLowerCase()
                        ? " (you)"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="shrink-0">Sort</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as RepoSort)}
                  aria-label="Sort repositories"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 min-w-0 flex-1 rounded-lg border bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:ring-3 sm:w-40"
                >
                  <option value="updated">Recently updated</option>
                  <option value="name">Name A-Z</option>
                  <option value="owner">Owner A-Z</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(SCOPE_LABELS) as RepoScope[]).map((value) => {
                const disabled = value === "mine" && !currentGitHubLogin;
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={scope === value ? "secondary" : "ghost"}
                    size="sm"
                    aria-pressed={scope === value}
                    disabled={disabled}
                    title={
                      disabled
                        ? "Sign in with GitHub to identify repositories you own"
                        : undefined
                    }
                    onClick={() => {
                      setScope(value);
                      if (value === "mine") {
                        setOwner("all");
                      }
                    }}
                  >
                    {SCOPE_LABELS[value]}
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="text-muted-foreground text-xs whitespace-nowrap">
                {filteredRepos.length} of {repos.length} repositories
              </p>
              <div
                className="border-border bg-muted/40 flex items-center rounded-lg border p-0.5"
                role="group"
                aria-label="Repository view mode"
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
        </CardContent>
      </Card>

      {filteredRepos.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching repositories"
          description="Try a different search, owner, or repository filter."
          action={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : viewMode === "tiles" ? (
        <RepositoryTiles repos={filteredRepos} />
      ) : (
        <RepositoryList repos={filteredRepos} />
      )}
    </div>
  );
}

function RepositoryTiles({ repos }: { repos: GitHubRepo[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {repos.map((repo) => (
        <Link
          key={repo.id}
          href={repo.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="group"
        >
          <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <RepoOwnerAvatar repo={repo} />
                <ExternalLink className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="line-clamp-1">{repo.name}</CardTitle>
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {repo.ownerLogin}
                </p>
              </div>
              <CardDescription className="line-clamp-2 min-h-10">
                {repo.description ?? "No description yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <RepoMetadata repo={repo} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function RepositoryList({ repos }: { repos: GitHubRepo[] }) {
  return (
    <div className="space-y-2">
      {repos.map((repo) => (
        <Link
          key={repo.id}
          href={repo.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="group"
        >
          <Card
            size="sm"
            className="transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
          >
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <RepoOwnerAvatar repo={repo} className="size-9 rounded-lg" />
              <div className="min-w-0 flex-1">
                <CardTitle className="line-clamp-1">{repo.fullName}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {repo.description ?? "No description yet."}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <RepoMetadata repo={repo} compact />
                <ArrowRight className="text-muted-foreground ml-auto size-4 transition-transform group-hover:translate-x-0.5 sm:ml-1" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function RepoOwnerAvatar({
  repo,
  className,
}: {
  repo: GitHubRepo;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-10 shrink-0 rounded-xl", className)}>
      {repo.ownerAvatarUrl ? (
        <AvatarImage src={repo.ownerAvatarUrl} alt={repo.ownerLogin} />
      ) : null}
      <AvatarFallback className="rounded-xl">
        {repo.ownerLogin.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function RepoMetadata({
  repo,
  compact = false,
}: {
  repo: GitHubRepo;
  compact?: boolean;
}) {
  const updatedAt = new Date(repo.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs",
        compact && "sm:justify-end",
      )}
    >
      <Badge variant={repo.private ? "secondary" : "outline"}>
        {repo.private ? "Private" : "Public"}
      </Badge>
      {repo.language ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-primary size-1.5 rounded-full" />
          {repo.language}
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5">
        <CalendarClock className="size-3.5" />
        Updated {updatedAt}
      </span>
    </div>
  );
}
