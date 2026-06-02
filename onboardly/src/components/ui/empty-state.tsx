// Reusable empty state — shown when a list/section has no data yet.

import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <h3 className="font-heading text-base font-medium">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
