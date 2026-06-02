// Auth server actions — sign in (email/password), sign up, GitHub OAuth, and
// sign out. Called from the login form and the auth header. All run on the
// server and rely on the Supabase server client (cookie-based session).

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { GH_PROVIDER_TOKEN_COOKIE } from "@/lib/github/oauth";
import { upsertUserIdentity } from "@/lib/auth/profile";

type AuthState = { error: string } | undefined;

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

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  // With email confirmation on, the user must verify before a session exists.
  return { error: "Check your email to confirm your account, then sign in." };
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
