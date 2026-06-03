// "Today's focus" card — the day's tasks with a leading status dot, a
// title + subtitle, and a right-aligned duration. Footer links to the plan.

import { CalendarCheck } from "lucide-react";
import type { FocusTask } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";
import { StatusIcon } from "./status";

export function TodaysFocusCard({ tasks }: { tasks: FocusTask[] }) {
  return (
    <DashboardCard
      title="Today's focus"
      icon={CalendarCheck}
      footerHref="/dashboard/plan"
      footerLabel="View all tasks"
    >
      <ul className="flex flex-col gap-4">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-3">
            <StatusIcon status={task.status} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{task.title}</p>
              <p className="text-muted-foreground text-xs">{task.subtitle}</p>
            </div>
            <span className="text-muted-foreground shrink-0 text-xs">
              {task.duration}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
