"use client";

// Login form — email/password sign-in is the primary path; "Continue with
// GitHub" is an optional shortcut above it. Email sign-in uses useActionState to
// surface server-side errors inline. Account creation lives on /register.

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithPassword } from "@/lib/auth/actions";
import { GitHubAuthButton } from "@/components/auth/GitHubAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [signInState, signInAction, signingIn] = useActionState(
    signInWithPassword,
    undefined,
  );

  return (
    <div className="flex flex-col gap-5">
      <GitHubAuthButton redirectTo={redirectTo} />

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or continue with email</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form action={signInAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        {signInState?.error ? (
          <p className="text-destructive text-sm" role="alert">
            {signInState.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          variant="outline"
          className="mt-1 w-full"
          disabled={signingIn}
        >
          {signingIn ? <Loader2 className="size-4 animate-spin" /> : null}
          {signingIn ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
