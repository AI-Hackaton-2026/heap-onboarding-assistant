// Shared placeholder for dashboard sub-routes that aren't built yet (My Plan,
// Resources, AI Assistant, Settings). Keeps the sidebar links from being dead
// while the real surfaces are pending. Token-colored, responsive.

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader title={title} subtitle={description} icon={Icon} />
      <EmptyState
        icon={Icon}
        title="Coming soon"
        description="This part of your onboarding experience is on the way."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft />
              Back to overview
            </Link>
          </Button>
        }
      />
    </div>
  );
}
