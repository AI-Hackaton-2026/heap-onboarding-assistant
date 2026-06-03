// Shared status iconography + colors for the dashboard cards. The
// completed / in-progress / up-next vocabulary is reused across Today's focus,
// My onboarding progress, and Recent activity, so the visual language lives in
// one place. Token-colored only (success token for done, primary for active).

import { CheckCircle2, CircleDot, Circle } from "lucide-react";
import type { StepStatus } from "@/types/dashboard";
import { cn } from "@/lib/utils";

/** Leading status icon for a step/task row. */
export function StatusIcon({
  status,
  className,
}: {
  status: StepStatus;
  className?: string;
}) {
  if (status === "completed") {
    return (
      <CheckCircle2
        className={cn("text-success size-5 shrink-0", className)}
        aria-hidden
      />
    );
  }
  if (status === "in-progress") {
    return (
      <CircleDot
        className={cn("text-primary size-5 shrink-0", className)}
        aria-hidden
      />
    );
  }
  return (
    <Circle
      className={cn("text-muted-foreground/40 size-5 shrink-0", className)}
      aria-hidden
    />
  );
}

const STATUS_LABEL: Record<StepStatus, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  "up-next": "Up next",
};

/** Right-aligned status label, colored per status. */
export function StatusLabel({
  status,
  className,
}: {
  status: StepStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs font-medium",
        status === "completed" && "text-success",
        status === "in-progress" && "text-primary",
        status === "up-next" && "text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
