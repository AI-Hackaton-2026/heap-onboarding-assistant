// User + provider identity upsert. Keeps the app-owned user directory in sync
// so collaborator discovery can intersect GitHub repo collaborators with real
// Onboardly users.
//
// Called from the OAuth/email callback after exchangeCodeForSession. For GitHub
// logins, Supabase puts the GitHub login under user_metadata.user_name and the
// avatar/name under avatar_url/name. Email-only users still get a User row.

import { prisma } from "@/lib/db/prisma";
import { Provider } from "@/generated/prisma/enums";
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
 * Upsert the current user and, for GitHub logins, their provider identity.
 * GitHub login is stored lowercased because it is the collaborator join key.
 * Best-effort: callers should not fail sign-in if this throws.
 */
export async function upsertUserIdentity(user: User): Promise<void> {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;

  const githubLogin = metaString(metadata, "user_name")?.toLowerCase() ?? null;
  const displayName =
    metaString(metadata, "name") ?? metaString(metadata, "full_name");
  const avatarUrl = metaString(metadata, "avatar_url");
  const email = user.email ?? metaString(metadata, "email");
  const externalId =
    metaString(metadata, "provider_id") ?? metaString(metadata, "sub");

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      ...(email ? { email } : {}),
      ...(displayName ? { displayName } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    },
    create: {
      id: user.id,
      email,
      displayName,
      avatarUrl,
    },
  });

  if (!githubLogin) return;

  await prisma.userIdentity.upsert({
    where: {
      userId_provider: { userId: user.id, provider: Provider.GITHUB },
    },
    update: {
      externalLogin: githubLogin,
      ...(externalId ? { externalId } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      isLogin: true,
    },
    create: {
      userId: user.id,
      provider: Provider.GITHUB,
      externalId,
      externalLogin: githubLogin,
      avatarUrl,
      isLogin: true,
    },
  });
}
