// Reusable icon-led empty state shown when a list or section has no data yet.

import type { ComponentType, ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border-border bg-card/50 flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
      {Icon ? (
        <span className="bg-primary/10 text-primary mb-4 inline-flex size-11 items-center justify-center rounded-2xl">
          <Icon className="size-5" />
        </span>
      ) : null}
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-6">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
