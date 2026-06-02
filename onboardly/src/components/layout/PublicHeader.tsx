// Simple header for public (unauthenticated) pages.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function PublicHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur">
      <Link href="/" className="font-heading text-lg font-semibold">
        Onboardly
      </Link>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/dashboard">Get started</Link>
        </Button>
      </nav>
    </header>
  );
}
