// Header for authenticated pages. Logo + functional global search (cmd/ctrl+K),
// theme toggle, and notifications bell.

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, X } from "lucide-react";
import { AppIcon } from "@/components/layout/AppIcon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpButton } from "@/components/onboarding/HelpButton";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";

interface AuthHeaderProps {
  email: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

export function AuthHeader({ email, avatarUrl, displayName }: AuthHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/projects?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <header className="border-border bg-background/90 flex h-16 items-stretch border-b backdrop-blur">
      <div className="border-border flex shrink-0 items-center gap-1 px-2 sm:px-4 md:w-56 md:border-r md:px-7">
        <MobileNav email={email} avatarUrl={avatarUrl} displayName={displayName} />
        <Link
          href="/dashboard"
          className="font-heading flex shrink-0 items-center gap-2 text-base font-semibold"
        >
          <AppIcon className="size-7" />
          <span>Onboardly</span>
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 items-center px-2 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <div className="hidden w-full max-w-md md:block" data-tour="search">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects…"
                  className="border-ring bg-background focus:ring-ring/30 h-9 w-full rounded-lg border pl-8 pr-8 text-sm outline-none focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                >
                  <X className="size-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
                className="border-border bg-muted/40 text-muted-foreground hover:bg-muted/60 flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
              >
                <Search className="size-4 shrink-0" />
                <span className="flex-1 text-left">Search projects…</span>
                <kbd className="bg-background text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-medium">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex"
              data-tour="tasks"
            >
              <Link href="/dashboard/plan">Open today&apos;s tasks</Link>
            </Button>
            <span data-tour="theme" className="inline-flex">
              <ThemeToggle />
            </span>
            <HelpButton />
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <div className="hidden sm:block md:hidden">
              <UserMenu email={email} avatarUrl={avatarUrl} displayName={displayName} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
