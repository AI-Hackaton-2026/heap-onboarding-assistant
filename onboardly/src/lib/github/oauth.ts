// GitHub OAuth (user-token) helpers.
//
// These power the *immediate* repo-listing UX: after GitHub login, Supabase
// hands us a short-lived user-scoped `provider_token`. We capture it at the
// OAuth callback (see src/app/auth/callback/route.ts) and use it here to list
// the repositories the user can see.
//
// This is distinct from the GitHub App installation flow in client.ts — the
// App (installation tokens) is the Phase-3 *ingestion* path. Here we cross-
// reference the two so the listing can flag which repos are "ingestion-ready"
// (i.e. the user has installed the Onboardly App on them).

const GITHUB_API = "https://api.github.com";

// httpOnly cookie that holds the user's GitHub provider_token between the OAuth
// callback and server-rendered repo listing. Short-lived, like the token.
export const GH_PROVIDER_TOKEN_COOKIE = "gh_provider_token";

/**
 * Public GitHub App installation page used by repo-connection UI. Pass a
 * projectId to round-trip it as `state`; GitHub returns it to our Setup URL
 * (/api/github/callback) so the resulting installation can be attached to that
 * project's GitHub connection.
 */
export function githubAppInstallUrl(projectId?: string): string {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  const base = slug
    ? `https://github.com/apps/${slug}/installations/new`
    : "https://github.com/settings/installations";
  return projectId
    ? `${base}?state=${encodeURIComponent(projectId)}`
    : base;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  defaultBranch: string;
  language: string | null;
  updatedAt: string;
  /** True when the Onboardly GitHub App is installed on this repo (ingestion-ready). */
  ingestionReady: boolean;
}

// Raw shapes from the GitHub REST API (only the fields we consume).
interface RawRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  language: string | null;
  updated_at: string;
}

function userAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function repoApiPath(fullName: string): string | null {
  const [owner, repo, ...rest] = fullName.split("/");
  if (!owner || !repo || rest.length > 0) {
    return null;
  }

  return `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

/**
 * List repositories the authenticated user can access, most-recently-updated
 * first. Paginates until GitHub returns a short page (no more results).
 */
async function fetchAllUserRepos(token: string): Promise<RawRepo[]> {
  const perPage = 100;
  const repos: RawRepo[] = [];

  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
      { headers: userAuthHeaders(token), cache: "no-store" },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to list repos (${res.status}): ${body}`);
    }

    const batch = (await res.json()) as RawRepo[];
    repos.push(...batch);
    if (batch.length < perPage) break;
  }

  return repos;
}

/**
 * Collect the set of repo full-names (owner/name) that have the Onboardly
 * GitHub App installed, using the user's token. Returns an empty set if the
 * user has no installations or the call fails — listing should still work.
 */
async function fetchAppInstalledRepoNames(token: string): Promise<Set<string>> {
  const installed = new Set<string>();

  try {
    const installationsRes = await fetch(
      `${GITHUB_API}/user/installations?per_page=100`,
      { headers: userAuthHeaders(token), cache: "no-store" },
    );
    if (!installationsRes.ok) return installed;

    const { installations } = (await installationsRes.json()) as {
      installations: { id: number }[];
    };

    for (const installation of installations ?? []) {
      const reposRes = await fetch(
        `${GITHUB_API}/user/installations/${installation.id}/repositories?per_page=100`,
        { headers: userAuthHeaders(token), cache: "no-store" },
      );
      if (!reposRes.ok) continue;

      const { repositories } = (await reposRes.json()) as {
        repositories: { full_name: string }[];
      };
      for (const repo of repositories ?? []) {
        installed.add(repo.full_name);
      }
    }
  } catch {
    // Non-fatal: fall back to "no installs detected" so listing still renders.
    return installed;
  }

  return installed;
}

/**
 * List the user's repositories and flag which ones have the Onboardly GitHub
 * App installed (ingestion-ready). Uses the OAuth provider_token for both.
 */
export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const [raw, installedNames] = await Promise.all([
    fetchAllUserRepos(token),
    fetchAppInstalledRepoNames(token),
  ]);

  return raw.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    htmlUrl: repo.html_url,
    defaultBranch: repo.default_branch,
    language: repo.language,
    updatedAt: repo.updated_at,
    ingestionReady: installedNames.has(repo.full_name),
  }));
}

/**
 * Fetch a repository README as raw text. Missing READMEs are expected and
 * return null so project creation can fall back to the repo description.
 */
export async function fetchRepoReadme(
  token: string,
  fullName: string,
): Promise<string | null> {
  const path = repoApiPath(fullName);
  if (!path) {
    return null;
  }

  const res = await fetch(`${GITHUB_API}/repos/${path}/readme`, {
    headers: {
      ...userAuthHeaders(token),
      Accept: "application/vnd.github.raw+json",
    },
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch README (${res.status}): ${body}`);
  }

  const readme = (await res.text()).trim();
  return readme || null;
}
