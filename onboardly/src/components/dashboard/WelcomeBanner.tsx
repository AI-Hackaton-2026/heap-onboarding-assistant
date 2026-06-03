// Full-width welcome banner: greeting + subtext, the two primary CTAs, a
// decorative checklist illustration, and the embedded progress ring. Subtle
// tinted gradient background built from the primary token (themes light/dark).

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "./ProgressRing";

interface WelcomeBannerProps {
  userName: string;
  progressPercent: number;
}

export function WelcomeBanner({
  userName,
  progressPercent,
}: WelcomeBannerProps) {
  return (
    <section className="border-border from-primary/8 via-card to-card relative overflow-hidden rounded-xl border bg-gradient-to-r p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold sm:text-2xl">
            Welcome back, {userName} <span aria-hidden>👋</span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Here&apos;s what to focus on today in your onboarding journey.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/dashboard/plan">Open today&apos;s tasks</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/plan">View my plan</Link>
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          {/* Decorative onboarding illustration (theme-swapped via the .dark
              class). Hidden on small screens to keep the banner content-first
              on mobile. */}
          <div
            className="hidden size-36 shrink-0 sm:block lg:size-44"
            aria-hidden
          >
            <Image
              src="/onboarding-illustration-light.png"
              alt=""
              width={208}
              height={208}
              className="size-full object-contain dark:hidden"
              priority
            />
            <Image
              src="/onboarding-illustration-dark.png"
              alt=""
              width={208}
              height={208}
              className="hidden size-full object-contain dark:block"
              priority
            />
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:-ml-2 lg:-ml-3">
            <ProgressRing value={progressPercent} />
            <span className="text-muted-foreground text-xs font-medium">
              Your progress
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
