// Circular progress ring (pure SVG, no client JS). The track uses the muted
// border token and the progress arc uses the primary token, so it themes with
// light/dark automatically. `value` is a 0–100 percentage.

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** Completion percentage, 0–100. */
  value: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke width in px. */
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% complete`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="font-heading text-foreground text-xl font-bold">
          {clamped}%
        </span>
      </span>
    </div>
  );
}
