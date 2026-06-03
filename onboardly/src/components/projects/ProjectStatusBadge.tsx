// Renders a project's status as a labelled badge. Shared by the projects list,
// the project detail page, and the dashboard so status styling stays consistent.

import { Badge } from "@/components/ui/badge";
import { ProjectStatus } from "@/generated/prisma/enums";
import { AlertCircle, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const STATUS_META: Record<
  ProjectStatus,
  {
    label: string;
    variant: BadgeVariant;
    icon: typeof CircleDashed;
    iconClassName?: string;
  }
> = {
  [ProjectStatus.DRAFT]: {
    label: "Draft",
    variant: "outline",
    icon: CircleDashed,
  },
  [ProjectStatus.SYNCING]: {
    label: "Syncing",
    variant: "secondary",
    icon: Loader2,
    iconClassName: "animate-spin",
  },
  [ProjectStatus.READY]: {
    label: "Ready",
    variant: "default",
    icon: CheckCircle2,
  },
  [ProjectStatus.ERROR]: {
    label: "Error",
    variant: "destructive",
    icon: AlertCircle,
  },
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge className={className} variant={meta.variant}>
      <Icon className={meta.iconClassName} />
      {meta.label}
    </Badge>
  );
}
