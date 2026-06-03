"use client";

// Register form — email/password account creation is the primary path
// (display name, username, email, password); "Continue with GitHub" is an
// optional shortcut above it. Submits the signUpWithProfile server action,
// which validates fields, checks username availability, and signs the user in.

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { signUpWithProfile } from "@/lib/auth/actions";
import { GitHubAuthButton } from "@/components/auth/GitHubAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(
    signUpWithProfile,
    undefined,
  );
  // Live confirm-password match check for instant feedback (the server action
  // also re-validates the match — never trust the client alone).
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="flex flex-col gap-5">
      <GitHubAuthButton redirectTo={redirectTo} />

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">
          or create account with email
        </span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Alex Carter"
            maxLength={80}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="alexcarter"
            pattern="[A-Za-z0-9_\-]{3,30}"
            title="3–30 characters: letters, numbers, hyphens, or underscores"
            required
          />
          <p className="text-muted-foreground text-xs">
            Lowercase letters, numbers, hyphens, or underscores.
          </p>
        </div>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch}
            required
          />
          {mismatch ? (
            <p className="text-destructive text-xs">Passwords don&apos;t match.</p>
          ) : null}
        </div>

        {state?.error ? (
          <p className="text-destructive text-sm" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          variant="outline"
          className="mt-1 w-full"
          disabled={pending || mismatch}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
