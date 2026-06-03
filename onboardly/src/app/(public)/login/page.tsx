// Login page — public route. Renders the GitHub + email/password login form.
// Already-authenticated users are redirected to the dashboard (middleware also
// enforces this; the server check avoids a flash of the form).

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppIcon } from "@/components/layout/AppIcon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

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
    <main className="bg-background relative flex min-h-svh flex-col overflow-hidden">
      <div
        className="from-primary/10 via-background to-background absolute inset-0 -z-10 bg-gradient-to-br"
        aria-hidden
      />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-heading flex items-center gap-2 text-base font-semibold"
        >
          <AppIcon className="size-7" />
          Onboardly
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <span className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-2xl">
              <Sparkles className="size-5" />
            </span>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue your onboarding.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-2 sm:p-3">
              {error ? (
                <p
                  className="text-destructive bg-destructive/10 mb-4 rounded-lg px-3 py-2 text-sm"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <LoginForm redirectTo={safeRedirect} />
            </CardContent>
          </Card>

          <p className="text-muted-foreground mt-6 text-center text-xs">
            By continuing you agree to Onboardly&apos;s terms.
          </p>
        </div>
      </div>
    </main>
  );
}
