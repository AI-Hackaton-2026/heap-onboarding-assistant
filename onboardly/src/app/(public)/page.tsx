// Public landing / welcome page for Onboardly.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="font-heading max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Onboarding that actually gets used
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          An AI onboarding assistant grounded in your company&apos;s GitHub,
          Slack, and docs — with cited sources, generated courses, and a chat
          that doesn&apos;t make things up.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/dashboard">Get started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
