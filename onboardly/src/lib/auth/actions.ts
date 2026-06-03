// Auth server actions — sign in (email/password), sign up, GitHub OAuth, and
// sign out. Called from the login form and the auth header. All run on the
// server and rely on the Supabase server client (cookie-based session).

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { GH_PROVIDER_TOKEN_COOKIE } from "@/lib/github/oauth";
import { upsertUserIdentity } from "@/lib/auth/profile";

type AuthState = { error: string } | undefined;

// Lowercase letters, numbers, _ and -, 3–30 chars. Kept simple — usernames are
// a display/handle field, not a routing key.
const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

function safeRedirectPath(value: FormDataEntryValue | null): string {
  // Only allow internal paths to avoid open-redirects.
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return "/dashboard";
}

export async function signInWithPassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    try {
      await upsertUserIdentity(data.user);
    } catch (profileError) {
      console.error("Failed to upsert user identity:", profileError);
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpWithPassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // No email verification step: log the user in straight away. When the project
  // has email confirmation disabled, signUp already returns a session; otherwise
  // establish one explicitly with the same credentials.
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return { error: signInError.message };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      await upsertUserIdentity(user);
    } catch (profileError) {
      console.error("Failed to upsert user identity:", profileError);
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Full email/password registration from the dedicated Register page: collects a
 * display name, a unique username, email, and password. Username uniqueness is
 * checked against the app-owned User table before sign-up (it's our column, not
 * Supabase's). Display name + username are passed as user_metadata so the auth
 * callback / identity sync persist them. Assumes email confirmation is OFF, so a
 * session exists immediately and we redirect into the app.
 */
export async function signUpWithProfile(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (!displayName || !username || !email || !password) {
    return { error: "All fields are required." };
  }
  if (displayName.length > 80) {
    return { error: "Display name must be 80 characters or fewer." };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      error:
        "Username must be 3–30 characters: lowercase letters, numbers, hyphens, or underscores.",
    };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  // Username lives in our User table, so check availability here for a clear
  // message rather than failing later on the unique constraint.
  const taken = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (taken) {
    return { error: "That username is already taken." };
  }

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: displayName, username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation OFF → a session is returned immediately. Sync the app
  // user directory now (the email flow never hits /auth/callback), then enter
  // the app. If confirmation is unexpectedly ON, there's no session; fall back
  // to a confirm-your-email message rather than redirecting to a logged-out app.
  if (!data.session) {
    return { error: "Check your email to confirm your account, then sign in." };
  }

  if (data.user) {
    try {
      await upsertUserIdentity(data.user);
    } catch (profileError) {
      console.error("Failed to upsert user identity:", profileError);
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signInWithGitHub(formData: FormData): Promise<void> {
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));
  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      // Scopes needed to read the user's profile and list their repositories
      // (incl. private + org repos). The resulting provider_token is captured
      // at the callback so we can list repos on the user's behalf.
      scopes: "read:user repo read:org",
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(GH_PROVIDER_TOKEN_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}
