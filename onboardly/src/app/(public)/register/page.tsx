// Register page — public route. Email/password account creation (display name,
// username, email, password) with an optional "Sign up with GitHub" shortcut.
// Already-authenticated users are redirected to the dashboard. Mirrors the login
// page's layout via the shared AuthShell/AuthCard.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";

export default async function RegisterPage({
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

  const loginHref =
    safeRedirect === "/dashboard"
      ? "/login"
      : `/login?redirectTo=${encodeURIComponent(safeRedirect)}`;

  return (
    <AuthShell>
      <AuthCard
        title="Create your account"
        description="Start your onboarding journey with personalized plans and company knowledge."
        error={error}
        footer={
          <>
            Already have an account?{" "}
            <Link href={loginHref} className="text-primary font-medium hover:underline">
              Sign in
            </Link>
            <span className="mt-1 block">
              By creating an account, you agree to Onboardly&apos;s{" "}
              <Link href="/terms" className="hover:text-foreground underline underline-offset-2">
                Terms of Service
              </Link>
              .
            </span>
          </>
        }
      >
        <RegisterForm redirectTo={safeRedirect} />
      </AuthCard>
    </AuthShell>
  );
}
