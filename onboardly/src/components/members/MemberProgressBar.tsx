import { cn } from "@/lib/utils";

// Onboarding progress for a member. The percent is always *derived* upstream
// (completed lessons / total) — never stored. `null` means there's nothing to
// measure yet (no course/lessons), so we show "Not started" instead of a bar.

export function MemberProgressBar({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <span className="text-muted-foreground text-xs">Not started</span>
    );
  }

  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex items-center gap-2">
      <div
        className="bg-muted h-1.5 w-20 overflow-hidden rounded-full sm:w-28"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("bg-primary h-full rounded-full transition-all")}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}
