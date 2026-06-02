// OAuth / email-confirmation callback.
//
// Supabase redirects here with a `code` after GitHub OAuth or email
// confirmation. We exchange it for a session (cookies set via the server
// client) and then forward the user to their intended destination.
//
// For GitHub OAuth, the exchange is also the *only* moment we receive the
// user-scoped `provider_token` — it isn't persisted in the Supabase session
// afterward. We stash it in a short-lived httpOnly cookie so server-rendered
// pages can list the user's repositories on their behalf.

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { GH_PROVIDER_TOKEN_COOKIE } from "@/lib/github/oauth";
import { upsertUserProfile } from "@/lib/auth/profile";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const safePath =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Keep the Onboardly directory in sync so collaborator discovery can match
      // this user by GitHub login. Best-effort — never block sign-in on it.
      const user = data.session?.user;
      if (user) {
        try {
          await upsertUserProfile(user);
        } catch (profileError) {
          console.error("Failed to upsert user profile:", profileError);
        }
      }

      // Capture the GitHub user token (present only for the OAuth flow) so we
      // can list the user's repos. Mirrors the provider token's short lifetime.
      const providerToken = data.session?.provider_token;
      if (providerToken) {
        const cookieStore = await cookies();
        cookieStore.set(GH_PROVIDER_TOKEN_COOKIE, providerToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60, // ~1h, matching GitHub's token lifetime
        });
      }
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Could not sign you in. Please try again.")}`,
  );
}
