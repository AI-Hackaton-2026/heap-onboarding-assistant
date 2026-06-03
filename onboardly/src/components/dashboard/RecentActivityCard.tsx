// "Recent activity" card (full-width) — a feed of recent onboarding actions,
// each with a leading status icon, the activity text, and a date. Footer links
// to the full activity log.

import type { ActivityItem } from "@/types/dashboard";
import { Activity } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { StatusIcon } from "./status";

export function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <DashboardCard
      title="Recent activity"
      icon={Activity}
      footerHref="/dashboard/plan"
      footerLabel="View all activity"
    >
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <StatusIcon status={item.status} />
            <span className="min-w-0 flex-1 text-sm">{item.text}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {item.date}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
