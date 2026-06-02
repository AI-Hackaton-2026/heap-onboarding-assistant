// GitHub repo collaborators — the discovery source for adding project members.
//
// We list *collaborators* (anyone with repo access), not *contributors* (anyone
// who's committed), so a brand-new hire with 0 commits still appears the moment
// they're granted access. This uses an installation access token (the GitHub App
// must be installed on the repo); see src/lib/github/client.ts for token minting.
//
// The returned `login` is the lowercased join key against
// UserIdentity.externalLogin; see src/lib/members/candidates.ts.

import { installationAuthHeaders } from "@/lib/github/client";

const GITHUB_API = "https://api.github.com";

/** A repo collaborator as we use it for discovery. `login` is lowercased. */
export interface RepoCollaborator {
  login: string;
  avatarUrl: string | null;
}

/** Owner + repo name parsed from a stored GitHub connection reference. */
export interface RepoRef {
  owner: string;
  repo: string;
}

/**
 * Parse a stored repo reference into { owner, repo }. Accepts the common forms
 * we let admins enter: "owner/repo", a full "https://github.com/owner/repo(.git)"
 * URL, or "github.com/owner/repo". Returns null when it can't be parsed.
 */
export function parseRepoRef(repoReference: string | null): RepoRef | null {
  if (!repoReference) return null;
  let value = repoReference.trim();
  if (value.length === 0) return null;

  // Strip a scheme + host if a URL was pasted.
  value = value.replace(/^https?:\/\//i, "").replace(/^github\.com\//i, "");
  // Strip a trailing .git and any path beyond owner/repo.
  value = value.replace(/\.git$/i, "");

  const parts = value.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const [owner, repo] = parts;
  if (!owner || !repo) return null;
  return { owner, repo };
}

interface GitHubCollaboratorResponse {
  login?: unknown;
  avatar_url?: unknown;
}

/**
 * List all collaborators on a repo via the installation token, following
 * pagination. Logins are lowercased to match UserIdentity.externalLogin.
 * Throws on a non-OK response so callers can surface a connection error.
 */
export async function listRepoCollaborators(
  owner: string,
  repo: string,
  installationId: string | number,
): Promise<RepoCollaborator[]> {
  const headers = await installationAuthHeaders(installationId);
  const collaborators: RepoCollaborator[] = [];
  const perPage = 100;

  for (let page = 1; ; page++) {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/collaborators?per_page=${perPage}&page=${page}`,
      { headers },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Failed to list collaborators for ${owner}/${repo} (${res.status}): ${body}`,
      );
    }

    const batch = (await res.json()) as GitHubCollaboratorResponse[];
    for (const c of batch) {
      if (typeof c.login === "string" && c.login.length > 0) {
        collaborators.push({
          login: c.login.toLowerCase(),
          avatarUrl: typeof c.avatar_url === "string" ? c.avatar_url : null,
        });
      }
    }

    if (batch.length < perPage) break;
  }

  return collaborators;
}
