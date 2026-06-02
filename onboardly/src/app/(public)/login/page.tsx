// Login page — public route. Renders the GitHub + email/password login form.
// Already-authenticated users are redirected to the dashboard (middleware also
// enforces this; the server check avoids a flash of the form).

import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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

  return (
    <main className="bg-background flex min-h-svh flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-heading text-base font-semibold">
          Onboardly
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl">
              <Sparkles className="size-5" />
            </span>
            <h1 className="font-heading text-xl font-semibold">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue your onboarding.
            </p>
          </div>

          <div className="bg-card text-card-foreground ring-foreground/10 rounded-xl p-6 ring-1">
            {error ? (
              <p
                className="text-destructive bg-destructive/10 mb-4 rounded-lg px-3 py-2 text-sm"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <LoginForm redirectTo={safeRedirect} />
          </div>

          <p className="text-muted-foreground mt-6 text-center text-xs">
            By continuing you agree to Onboardly&apos;s terms.
          </p>
        </div>
      </div>
    </main>
  );
}
