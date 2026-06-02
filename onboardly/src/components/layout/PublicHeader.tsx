// Simple header for public (unauthenticated) pages.

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Reviews", href: "#reviews" },
];

export function PublicHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-heading flex items-center gap-2 text-lg font-semibold"
        >
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </span>
          Onboardly
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <Link href="/dashboard">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Start Onboarding</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
