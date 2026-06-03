// Shared two-column page chrome for the public auth pages (login + register).
//
// Desktop: a brand/product panel on the left (logo, headline, supporting copy,
// and three benefit rows) and the auth card on the right. The left panel carries
// the same decoration as the landing page — a soft accent glow, concentric rings
// sweeping in from the edge, and a masked dot-grid cluster. Mobile: the large
// left panel is hidden and a condensed brand header sits above the centered card.
// Light/dark via theme tokens only.

import Link from "next/link";
import type { ReactNode } from "react";
import { Compass, BookOpen, ListChecks } from "lucide-react";
import { AppIcon } from "@/components/layout/AppIcon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const BENEFITS = [
  { icon: Compass, label: "Personalized onboarding plans" },
  { icon: BookOpen, label: "Answers from company knowledge" },
  { icon: ListChecks, label: "Progress saved across projects" },
] as const;

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-heading flex items-center gap-2 text-base font-semibold ${className ?? ""}`}
    >
      <AppIcon className="size-7" />
      Onboardly
    </Link>
  );
}

// Landing-page decoration: soft glow + concentric rings sweeping from the right
// edge + a masked dot-grid cluster (blurred copy under a crisp copy for a soft
// glow). Reused verbatim so auth feels part of the same product.
function BrandDecoration() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Soft accent glow. */}
      <div className="bg-primary/20 absolute top-1/2 left-1/3 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

      {/* Concentric rings sweeping in from the right edge (toward the card). */}
      <div className="border-primary/30 absolute top-1/2 right-0 size-72 translate-x-1/2 -translate-y-1/2 rounded-full border" />
      <div className="border-primary/20 absolute top-1/2 right-0 size-96 translate-x-1/2 -translate-y-1/2 rounded-full border" />
      <div className="border-primary/12 absolute top-1/2 right-0 size-128 translate-x-1/2 -translate-y-1/2 rounded-full border" />

      {/* Dot grid cluster, top-left negative space. */}
      <div className="absolute top-16 left-8 size-28">
        <div
          className="text-primary/70 absolute inset-0 blur-[3px]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1.6px, transparent 1.6px)",
            backgroundSize: "13px 13px",
            maskImage:
              "radial-gradient(circle at 35% 35%, #000 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle at 35% 35%, #000 0%, transparent 70%)",
          }}
        />
        <div
          className="text-primary/60 absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1.4px, transparent 1.4px)",
            backgroundSize: "13px 13px",
            maskImage:
              "radial-gradient(circle at 35% 35%, #000 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle at 35% 35%, #000 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background relative min-h-svh">
      {/* Theme toggle, pinned top-right across both columns. */}
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-svh w-full max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8">
        {/* Left: brand / product panel (desktop only). */}
        <aside className="bg-card relative hidden overflow-hidden rounded-3xl lg:flex lg:h-[min(40rem,85vh)] lg:flex-col lg:justify-between lg:p-12">
          {/* Subtle brand surface wash under the decoration. */}
          <div
            className="from-primary/8 via-card to-card absolute inset-0 -z-20 bg-linear-to-b"
            aria-hidden
          />
          <BrandDecoration />

          <Wordmark />

          <div className="max-w-md">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Start strong with guided onboarding.
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-7">
              Onboardly helps new hires follow a personalized plan, find answers
              from company knowledge, and track their first steps.
            </p>

            <ul className="mt-8 space-y-3">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Onboardly
          </p>
        </aside>

        {/* Right: auth card column. A lighter copy of the decoration shows on
            mobile (where the left panel is hidden) so the page isn't bare. */}
        <div className="relative flex flex-col justify-center overflow-hidden py-8 lg:py-0">
          <div className="lg:hidden">
            <BrandDecoration />
          </div>

          {/* Condensed brand header for mobile. */}
          <header className="relative mb-6 lg:hidden">
            <Wordmark />
          </header>

          <div className="relative mx-auto w-full max-w-[26rem]">{children}</div>
        </div>
      </div>
    </main>
  );
}
