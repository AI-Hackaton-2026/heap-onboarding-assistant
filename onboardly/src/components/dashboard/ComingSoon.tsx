// Shared placeholder for dashboard sub-routes that aren't built yet (My Plan,
// Resources, AI Assistant, Settings). Keeps the sidebar links from being dead
// while the real surfaces are pending. Token-colored, responsive.

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
        <span
          className="bg-primary/10 text-primary mb-4 inline-flex size-12 items-center justify-center rounded-full"
          aria-hidden
        >
          <Icon className="size-6" />
        </span>
        <h2 className="font-heading text-base font-medium">Coming soon</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          This part of your onboarding experience is on the way.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/dashboard">
            <ArrowLeft />
            Back to overview
          </Link>
        </Button>
      </div>
    </div>
  );
}
