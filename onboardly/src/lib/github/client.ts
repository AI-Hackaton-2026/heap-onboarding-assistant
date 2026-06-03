// GitHub App authentication helpers.
//
// A GitHub App authenticates in two steps:
//   1. Sign a short-lived JWT with the App's private key (identifies the App).
//   2. Exchange that JWT for an *installation access token* scoped to the repos
//      a user granted when they installed the App.
//
// The installation token is what we use to read repo contents / PRs / issues
// during sync (Phase 3). This module only mints credentials — the actual sync
// pipeline lives in src/lib/github/sync.ts.

import { createSign } from "node:crypto";

const GITHUB_API = "https://api.github.com";

function getAppCredentials(): { appId: string; privateKey: string } {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) {
    throw new Error(
      "GitHub App not configured: set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY.",
    );
  }
  // Allow the key to be stored with literal \n escapes in .env.local.
  return { appId, privateKey: privateKey.replace(/\\n/g, "\n") };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Build a signed JWT for the GitHub App (valid ~10 minutes). Used as a Bearer
 * token to call App-level endpoints, e.g. creating installation tokens.
 */
export function createAppJwt(): string {
  const { appId, privateKey } = getAppCredentials();
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iat: now - 60, // clock-skew allowance
      exp: now + 9 * 60, // max 10 min; stay under it
      iss: appId,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = base64url(signer.sign(privateKey));

  return `${header}.${payload}.${signature}`;
}

/**
 * Exchange the App JWT for an installation access token scoped to a single
 * installation (the set of repos a user granted). Tokens last ~1 hour.
 */
export async function getInstallationToken(
  installationId: string | number,
): Promise<string> {
  const jwt = createAppJwt();
  const res = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to create installation token (${res.status}): ${body}`,
    );
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}

/**
 * Resolve the installation id for a specific repo via the App JWT
 * (GET /repos/{owner}/{repo}/installation). Returns null when the App isn't
 * installed on that repo (404) so callers can degrade gracefully. This lets
 * member discovery work for any repo the App is installed on, without a stored
 * integration row (the Phase-3 connect flow will persist it later).
 */
export async function getRepoInstallationId(
  owner: string,
  repo: string,
): Promise<string | null> {
  const jwt = createAppJwt();
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/installation`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (res.status === 404) return null; // App not installed on this repo.
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to resolve installation for ${owner}/${repo} (${res.status}): ${body}`,
    );
  }

  const data = (await res.json()) as { id?: number | string };
  return data.id != null ? String(data.id) : null;
}

/**
 * Build authorization headers for installation-scoped REST calls.
 */
export async function installationAuthHeaders(
  installationId: string | number,
): Promise<HeadersInit> {
  const token = await getInstallationToken(installationId);
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** A repo as confirmed-readable through an installation token. */
export interface VerifiedRepo {
  fullName: string;
  private: boolean;
  defaultBranch: string;
}

/**
 * Verify an installation can actually read a repo by minting an installation
 * token and hitting GET /repos/{owner}/{repo}. Returns the repo metadata on
 * success, or null when the token can't see the repo (404 — wrong installation
 * or the repo isn't in scope). Throws on other errors (auth/network) so callers
 * can distinguish "not connected" from "couldn't reach GitHub".
 */
export async function verifyRepoAccess(
  owner: string,
  repo: string,
  installationId: string | number,
): Promise<VerifiedRepo | null> {
  const headers = await installationAuthHeaders(installationId);
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });

  if (res.status === 404) return null; // installation can't see this repo
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to verify repo access for ${owner}/${repo} (${res.status}): ${body}`,
    );
  }

  const data = (await res.json()) as {
    full_name?: string;
    private?: boolean;
    default_branch?: string;
  };
  return {
    fullName: data.full_name ?? `${owner}/${repo}`,
    private: data.private ?? false,
    defaultBranch: data.default_branch ?? "main",
  };
}
