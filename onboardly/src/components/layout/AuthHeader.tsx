// Header for authenticated pages. Logo + a (static) global search affordance,
// the "Open today's tasks" CTA, theme toggle, and a notifications bell. The
// user identity/sign-out lives at the bottom of the sidebar on desktop; on
// mobile (sidebar hidden) the UserMenu is shown here. Search and bell are
// static UI affordances this slice.

import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { AppIcon } from "@/components/layout/AppIcon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";

interface AuthHeaderProps {
  email: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

export function AuthHeader({ email, avatarUrl, displayName }: AuthHeaderProps) {
  return (
    <header className="border-border bg-background/90 flex h-16 items-stretch border-b backdrop-blur">
      {/* Left segment mirrors the sidebar (w-56) and carries a right divider
          that lines up with the sidebar's right border below. Full-width with
          mobile padding when no sidebar. */}
      <div className="border-border flex shrink-0 items-center gap-1 px-2 sm:px-4 md:w-56 md:border-r md:px-7">
        <MobileNav
          email={email}
          avatarUrl={avatarUrl}
          displayName={displayName}
        />
        <Link
          href="/dashboard"
          className="font-heading flex shrink-0 items-center gap-2 text-base font-semibold"
        >
          <AppIcon className="size-7" />
          <span>Onboardly</span>
        </Link>
      </div>

      {/* Right segment mirrors the main content area (p-6 + max-w-6xl mx-auto)
          so the search aligns with the card column's left edge and the actions
          align with its right edge. */}
      <div className="flex min-w-0 flex-1 items-center px-2 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          {/* Static global-search affordance (behavior out of scope this slice). */}
          <div className="hidden w-full max-w-md md:block">
            <div className="border-border bg-muted/40 text-muted-foreground flex h-9 items-center gap-2 rounded-lg border px-3 text-sm">
              <Search className="size-4 shrink-0" />
              <span className="flex-1">Search anything…</span>
              <kbd className="bg-background text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard/plan">Open today&apos;s tasks</Link>
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
            >
              <Bell />
              <span
                className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full"
                aria-hidden
              />
            </Button>
            {/* Sidebar carries the user identity on desktop; show it here only
                on mobile, where the sidebar is hidden. */}
            <div className="hidden sm:block md:hidden">
              <UserMenu
                email={email}
                avatarUrl={avatarUrl}
                displayName={displayName}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
