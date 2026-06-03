"use client";

// Reusable "Continue with GitHub" button shared by the login and register
// forms. GitHub is the preferred auth flow, so this renders as the prominent
// (primary) button above the email form. Submits the existing signInWithGitHub
// server action; useFormStatus drives the loading state during the OAuth
// redirect round-trip.

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { signInWithGitHub } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// lucide-react dropped its GitHub brand glyph, so inline the official mark.
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <GitHubIcon />}
      {pending ? "Redirecting…" : label}
    </Button>
  );
}

interface GitHubAuthButtonProps {
  /** Internal path to return to after the OAuth round-trip. */
  redirectTo: string;
  /** Button label — e.g. "Continue with GitHub". */
  label?: string;
}

export function GitHubAuthButton({
  redirectTo,
  label = "Continue with GitHub",
}: GitHubAuthButtonProps) {
  return (
    <form action={signInWithGitHub}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <SubmitButton label={label} />
    </form>
  );
}
