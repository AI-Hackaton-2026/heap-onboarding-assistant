// "Ask Onboardly" card — a sparkle header, a short blurb, a tinted
// sample-question chip that links into the assistant, and an "Ask another
// question" footer.

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

export function AskOnboardlyCard({ sampleQuestion }: { sampleQuestion: string }) {
  return (
    <DashboardCard
      title="Ask Onboardly"
      icon={Sparkles}
      footerHref="/dashboard/assistant"
      footerLabel="Ask another question"
    >
      <p className="text-muted-foreground text-sm">
        Get answers to common questions as you onboard.
      </p>
      <Link
        href="/dashboard/assistant"
        className="bg-primary/8 hover:bg-primary/12 mt-4 flex items-center justify-between gap-3 rounded-lg p-3"
      >
        <span className="text-primary text-sm font-medium">
          {sampleQuestion}
        </span>
        <ArrowRight className="text-primary size-4 shrink-0" />
      </Link>
    </DashboardCard>
  );
}
