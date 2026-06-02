"use client";

// User menu — shows the signed-in identity and a sign-out action.
// Sign-out runs the server action which clears the session and redirects.

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function UserMenu({ email }: { email: string | null }) {
  const initial = email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-2">
      {email ? (
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {email}
        </span>
      ) : null}
      <span
        className="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-full text-sm font-medium"
        aria-hidden
      >
        {initial}
      </span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" title="Sign out">
          <LogOut />
          <span className="sr-only">Sign out</span>
        </Button>
      </form>
    </div>
  );
}
