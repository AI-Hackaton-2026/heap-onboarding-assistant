// Shared authenticated-page heading with optional icon, subtitle, badges, and
// right-aligned actions.

import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  badges,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {Icon ? (
            <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-xl">
              <Icon className="size-4.5" />
            </span>
          ) : null}
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {badges}
        </div>
        {subtitle ? (
          <div className="text-muted-foreground max-w-2xl text-sm leading-6">
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
