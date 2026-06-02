"use client";

// Login form — email/password sign-in + sign-up and GitHub OAuth.
// Email actions use useActionState to surface server-side errors inline.

import { useActionState } from "react";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGitHub,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// lucide-react dropped its GitHub brand glyph, so inline the official mark.
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [signInState, signInAction, signingIn] = useActionState(
    signInWithPassword,
    undefined,
  );
  const [signUpState, signUpAction, signingUp] = useActionState(
    signUpWithPassword,
    undefined,
  );

  const message = signInState?.error ?? signUpState?.error;

  return (
    <div className="flex flex-col gap-4">
      <form action={signInWithGitHub}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <GitHubIcon />
          Continue with GitHub
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form className="flex flex-col gap-3">
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

        {message ? (
          <p className="text-destructive text-sm" role="alert">
            {message}
          </p>
        ) : null}

        <div className="mt-1 flex flex-col gap-2">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            formAction={signInAction}
            disabled={signingIn || signingUp}
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            type="submit"
            size="lg"
            variant="ghost"
            className="w-full"
            formAction={signUpAction}
            disabled={signingIn || signingUp}
          >
            {signingUp ? "Creating account…" : "Create an account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
