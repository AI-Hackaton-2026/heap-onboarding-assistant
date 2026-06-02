// Public landing / welcome page for Onboardly.
// Faithful reproduction of the reference design (context/features/screenshots):
// badge + headline + subcopy + CTAs + feature row on the left, a fanned stack of
// overlapping product-preview cards on the right over a dot-grid + concentric-ring
// decoration, and a stats strip below. Responsive (single column on mobile,
// two-column split on large screens).
// All colors come from semantic theme tokens (no hardcoded values) so the page
// renders correctly in both light and dark mode.

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Compass,
  FileText,
  Flag,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";

const FEATURE_PILLS = [
  { icon: Compass, label: "Personalized plans" },
  { icon: BookOpen, label: "Company knowledge" },
  { icon: Check, label: "Guided first steps" },
];

const ONBOARDING_TASKS = [
  { label: "Complete your profile", done: true },
  { label: "Meet the team", done: true },
  { label: "Explore key resources", done: false },
  { label: "Finish first task", done: false },
];

const STATS = [
  { icon: Users, value: "5,000+", label: "Teams onboarded" },
  { icon: Star, value: "4.9/5", label: "Average rating" },
  { icon: Clock, value: "60%", label: "Faster ramp time" },
  { icon: ShieldCheck, value: "99%", label: "New hire satisfaction" },
];

// Gray skeleton placeholder lines used inside the preview cards.
function SkeletonLines({ widths }: { widths: string[] }) {
  return (
    <div className="space-y-1.5">
      {widths.map((w, i) => (
        <span
          key={i}
          className="bg-muted-foreground/20 block h-1.5 rounded-full"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: badge + messaging + CTAs + feature pills */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3" />
              AI onboarding assistant
            </span>

            <h1 className="font-heading text-foreground mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Help every
              <br />
              new hire <span className="text-primary">start strong.</span>
            </h1>

            <p className="text-muted-foreground mt-5 max-w-md text-base sm:text-lg">
              Onboardly gives employees personalized onboarding plans, answers
              from company knowledge, and guided first steps — all in one simple
              experience.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Start Onboarding
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>

            <ul className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs lg:justify-start">
              {FEATURE_PILLS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon className="text-primary size-3.5" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: background decoration + fanned preview cards.
              Decoration lives on this outer wrapper; the cards sit in an inner
              wrapper with padding so the dots and rings show in the surrounding
              negative space (and stay clipped inside, no bleed past the edge). */}
          <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] lg:mx-0 lg:max-w-none lg:p-8">
            {/* Background decoration: dot grid + concentric rings + glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
            >
              {/* Soft blue glow behind the middle card */}
              <div className="bg-primary/20 absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

              {/* Concentric arcs sweeping in from the right edge */}
              <div className="border-primary/30 absolute top-1/2 right-0 size-72 translate-x-1/2 -translate-y-1/2 rounded-full border" />
              <div className="border-primary/20 absolute top-1/2 right-0 size-96 translate-x-1/2 -translate-y-1/2 rounded-full border" />
              <div className="border-primary/12 absolute top-1/2 right-0 size-128 translate-x-1/2 -translate-y-1/2 rounded-full border" />

              {/* Dot grid cluster in the top-left negative space.
                  A blurred copy underneath gives the dots a soft glow; the crisp
                  copy on top keeps them defined. Both fade out via a radial mask. */}
              <div className="absolute top-2 left-0 size-28">
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

            {/* Onboarding plan card */}
            <div className="border-border bg-card relative z-0 rounded-2xl border p-5 shadow-lg transition-transform duration-300 lg:-rotate-2 lg:hover:rotate-0">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm font-semibold">
                  Your onboarding plan
                </span>
                <Flag className="text-primary size-4" />
              </div>
              <ul className="mt-4 space-y-2.5">
                {ONBOARDING_TASKS.map(({ label, done }) => (
                  <li key={label} className="flex items-center gap-2.5">
                    <span
                      className={`flex size-4 items-center justify-center rounded-full border ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {done && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span
                      className={`text-sm ${
                        done
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Welcome card — overlaps the plan card */}
            <div className="border-border bg-card relative z-10 -mt-2 ml-auto flex w-[90%] items-center gap-3 rounded-2xl border p-4 shadow-xl transition-transform duration-300 lg:rotate-3 lg:hover:rotate-0">
              <span className="bg-primary/15 flex size-11 shrink-0 items-center justify-center rounded-full text-xl">
                👋
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-semibold">
                  Welcome aboard, Alex!
                </p>
                <p className="text-muted-foreground mb-2 text-xs">
                  We&apos;re excited to have you here.
                </p>
                <SkeletonLines widths={["100%", "70%"]} />
              </div>
            </div>

            {/* Chat card — overlaps from below */}
            <div className="border-border bg-card relative z-20 -mt-2 mr-auto w-[94%] rounded-2xl border p-4 shadow-xl transition-transform duration-300 lg:-rotate-1 lg:hover:rotate-0">
              <div className="text-foreground flex items-center justify-between text-sm font-semibold">
                Ask Onboardly
                <Sparkles className="text-primary size-4" />
              </div>
              <div className="border-border bg-background mt-3 rounded-lg border px-3 py-2">
                <span className="text-muted-foreground text-xs">
                  Where can I find our PTO policy?
                </span>
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                Here&apos;s what I found in the handbook.
              </p>
              <div className="mt-2 flex items-start gap-2">
                <FileText className="text-primary mt-0.5 size-4 shrink-0" />
                <div className="flex-1 pt-1">
                  <SkeletonLines widths={["100%", "85%"]} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <section
          id="features"
          className="border-border mt-14 grid grid-cols-2 gap-6 border-t pt-8 sm:grid-cols-4 lg:mt-20"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 text-center"
            >
              <Icon className="text-primary size-5" />
              <span className="text-foreground text-2xl font-semibold">
                {value}
              </span>
              <span className="text-muted-foreground text-xs">{label}</span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
