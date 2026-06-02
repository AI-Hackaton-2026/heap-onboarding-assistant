// Public landing / welcome page for Onboardly.
// All colors come from semantic theme tokens (no hardcoded values) so the page
// renders correctly in both light and dark mode.

import Link from "next/link";
import { BookOpen, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PublicHeader } from "@/components/layout/PublicHeader";

const PREVIEW_CARDS = [
  {
    icon: BookOpen,
    title: "Personalized courses",
    description:
      "Enter a role and get a tailored onboarding plan — modules, lessons, checklists, and quizzes.",
  },
  {
    icon: MessageSquare,
    title: "Grounded answers",
    description:
      "Ask anything and get answers from your real docs, with a cited source for every claim.",
  },
  {
    icon: Users,
    title: "Know who to ask",
    description:
      "Surface feature owners and the right channels from your GitHub and Slack activity.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-16 text-center sm:py-24">
        <span className="border-border bg-secondary text-secondary-foreground inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
          Grounded in your GitHub, Slack &amp; docs
        </span>
        <h1 className="font-heading text-foreground mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Onboarding that actually gets used
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-base sm:text-lg">
          An AI onboarding assistant grounded in your company&apos;s GitHub,
          Slack, and docs — with cited sources, generated courses, and a chat
          that doesn&apos;t make things up.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Start Onboarding</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#how-it-works">How it works</Link>
          </Button>
        </div>

        <section
          id="how-it-works"
          className="mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-3"
        >
          {PREVIEW_CARDS.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="text-left">
              <CardHeader>
                <span className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-lg">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle className="mt-3">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
