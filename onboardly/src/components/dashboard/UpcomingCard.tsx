// "Upcoming" card — scheduled events with a title, date/time, and a Join
// action. Footer links to the full upcoming list.

import Link from "next/link";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UpcomingEvent } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

export function UpcomingCard({ events }: { events: UpcomingEvent[] }) {
  return (
    <DashboardCard
      title="Upcoming"
      icon={Calendar}
      footerHref="/dashboard/plan"
      footerLabel="View all upcoming"
    >
      <ul className="flex flex-col gap-4">
        {events.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{event.title}</p>
              <p className="text-muted-foreground text-xs">{event.when}</p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href={event.joinHref}>Join</Link>
            </Button>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
