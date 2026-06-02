// UserProfile upsert — keeps the Onboardly directory (Supabase user → GitHub
// identity) in sync so collaborator discovery can intersect "repo collaborators"
// with real Onboardly users.
//
// Called from the OAuth/email callback after exchangeCodeForSession. For GitHub
// logins, Supabase puts the GitHub login under user_metadata.user_name and the
// avatar/name under avatar_url/name; email-only users get a profile too (no
// githubLogin) so the row always exists for the current user.

import { prisma } from "@/lib/db/prisma";
import type { User } from "@supabase/supabase-js";

/** Read a string field from a metadata object, or null when absent/non-string. */
function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Upsert the current user's profile from their Supabase auth record. GitHub
 * login is stored lowercased (logins are case-insensitive) — it's the join key
 * for collaborator matching. Best-effort: callers should not fail the sign-in
 * if this throws (the profile fills in on the next login).
 */
export async function upsertUserProfile(user: User): Promise<void> {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;

  const githubLogin = metaString(metadata, "user_name")?.toLowerCase() ?? null;
  const displayName =
    metaString(metadata, "name") ?? metaString(metadata, "full_name");
  const avatarUrl = metaString(metadata, "avatar_url");
  const email = user.email ?? metaString(metadata, "email");

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      // Only overwrite with non-null values so an email re-login doesn't wipe a
      // previously-captured GitHub identity.
      ...(email ? { email } : {}),
      ...(githubLogin ? { githubLogin } : {}),
      ...(displayName ? { displayName } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    },
    create: {
      userId: user.id,
      email,
      githubLogin,
      displayName,
      avatarUrl,
    },
  });
}
