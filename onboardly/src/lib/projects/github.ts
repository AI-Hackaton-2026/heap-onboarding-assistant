// Server-side GitHub repository choices for project creation. Provider tokens
// stay in httpOnly cookies; client components receive only display-safe repo
// metadata and invoke server actions for README defaults.

import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  GH_PROVIDER_TOKEN_COOKIE,
  listUserRepos,
  type GitHubRepo,
} from "@/lib/github/oauth";
import { Provider } from "@/generated/prisma/enums";

export interface GitHubRepoOption {
  name: string;
  fullName: string;
  private: boolean;
  ingestionReady: boolean;
}

export interface AvailableGitHubRepos {
  status: "connected" | "not-connected" | "error";
  repos: GitHubRepoOption[];
}

interface AvailableGitHubRepo {
  repo: GitHubRepo;
  token: string;
}

function normalizeRepo(fullName: string): string {
  return fullName.trim().toLowerCase();
}

async function providerToken(): Promise<string | null> {
  return (await cookies()).get(GH_PROVIDER_TOKEN_COOKIE)?.value ?? null;
}

async function linkedRepoNames(): Promise<Set<string>> {
  const connections = await prisma.projectConnection.findMany({
    where: { provider: Provider.GITHUB, externalRef: { not: null } },
    select: { externalRef: true },
  });

  return new Set(
    connections.flatMap((connection) =>
      connection.externalRef ? [normalizeRepo(connection.externalRef)] : [],
    ),
  );
}

async function availableRepos(token: string): Promise<GitHubRepo[]> {
  const [repos, linked] = await Promise.all([
    listUserRepos(token),
    linkedRepoNames(),
  ]);

  return repos.filter((repo) => !linked.has(normalizeRepo(repo.fullName)));
}

/** List repos visible to the signed-in GitHub user and not linked elsewhere. */
export async function listAvailableGitHubRepos(): Promise<AvailableGitHubRepos> {
  const token = await providerToken();
  if (!token) {
    return { status: "not-connected", repos: [] };
  }

  try {
    const repos = await availableRepos(token);
    return {
      status: "connected",
      repos: repos.map((repo) => ({
        name: repo.name,
        fullName: repo.fullName,
        private: repo.private,
        ingestionReady: repo.ingestionReady,
      })),
    };
  } catch {
    return { status: "error", repos: [] };
  }
}

/**
 * Resolve one available repo again at action time. This prevents a stale or
 * tampered dropdown value from linking an inaccessible or already-linked repo.
 */
export async function findAvailableGitHubRepo(
  fullName: string,
): Promise<AvailableGitHubRepo | null> {
  const token = await providerToken();
  if (!token) {
    return null;
  }

  const normalized = normalizeRepo(fullName);
  const repos = await availableRepos(token);
  const repo = repos.find(
    (candidate) => normalizeRepo(candidate.fullName) === normalized,
  );

  return repo ? { repo, token } : null;
}
