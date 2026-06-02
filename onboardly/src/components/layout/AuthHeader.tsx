// Header for authenticated pages.

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AuthHeader() {
  return (
    <header className="border-border flex items-center justify-between border-b px-6 py-3">
      <Link href="/dashboard" className="font-heading text-base font-semibold">
        Onboardly
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {/* Placeholder for user menu / org switcher once auth is wired up. */}
        <div className="bg-muted size-8 rounded-full" aria-hidden />
      </div>
    </header>
  );
}
