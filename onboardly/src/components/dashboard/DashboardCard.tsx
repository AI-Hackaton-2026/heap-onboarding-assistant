// Shared wrapper for the dashboard cards: an optional leading icon + title
// header, the body, and an optional centered footer link (e.g. "View all
// tasks →"). Built on the existing Card primitive so all cards stay consistent.

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  /** lucide icon component rendered before the title. */
  icon?: ComponentType<{ className?: string }>;
  /** Optional footer link rendered centered with a trailing arrow. */
  footerHref?: string;
  footerLabel?: string;
  className?: string;
  children: ReactNode;
}

export function DashboardCard({
  title,
  icon: Icon,
  footerHref,
  footerLabel,
  className,
  children,
}: DashboardCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="text-primary size-4 shrink-0" /> : null}
          <h2 className="font-heading text-sm font-semibold">{title}</h2>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">{children}</CardContent>
      {footerHref && footerLabel ? (
        <div className="px-4 pb-1">
          <Link
            href={footerHref}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium"
          >
            {footerLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
