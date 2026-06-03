"use client";

// User menu — shows the signed-in identity and a sign-out action.
// Sign-out runs the server action which clears the session and redirects.

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserMenu({
  email,
  avatarUrl,
  displayName,
}: {
  email: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}) {
  const initial = (displayName || email)?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-2">
      {email ? (
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {email}
        </span>
      ) : null}
      <Avatar className="size-8">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {initial}
        </AvatarFallback>
      </Avatar>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" title="Sign out">
          <LogOut />
          <span className="sr-only">Sign out</span>
        </Button>
      </form>
    </div>
  );
}
