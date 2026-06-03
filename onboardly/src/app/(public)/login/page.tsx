// Login page — public route. Renders the GitHub + email/password login form.
// Already-authenticated users are redirected to the dashboard (middleware also
// enforces this; the server check avoids a flash of the form).

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  const registerHref =
    safeRedirect === "/dashboard"
      ? "/register"
      : `/register?redirectTo=${encodeURIComponent(safeRedirect)}`;

  return (
    <AuthShell>
      <AuthCard
        title="Welcome back"
        description="Sign in to continue your onboarding."
        error={error}
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link href={registerHref} className="text-primary font-medium hover:underline">
              Create one
            </Link>
            <span className="mt-1 block">
              By continuing, you agree to Onboardly&apos;s{" "}
              <Link href="/terms" className="hover:text-foreground underline underline-offset-2">
                Terms of Service
              </Link>
              .
            </span>
          </>
        }
      >
        <LoginForm redirectTo={safeRedirect} />
      </AuthCard>
    </AuthShell>
  );
}
