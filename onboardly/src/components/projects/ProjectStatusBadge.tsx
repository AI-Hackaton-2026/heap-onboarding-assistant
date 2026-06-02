// Renders a project's status as a labelled badge. Shared by the projects list,
// the project detail page, and the dashboard so status styling stays consistent.

import { Badge } from "@/components/ui/badge";
import { ProjectStatus } from "@/generated/prisma/enums";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const STATUS_META: Record<
  ProjectStatus,
  { label: string; variant: BadgeVariant }
> = {
  [ProjectStatus.DRAFT]: { label: "Draft", variant: "outline" },
  [ProjectStatus.SYNCING]: { label: "Syncing", variant: "secondary" },
  [ProjectStatus.READY]: { label: "Ready", variant: "default" },
  [ProjectStatus.ERROR]: { label: "Error", variant: "destructive" },
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge className={className} variant={meta.variant}>
      {meta.label}
    </Badge>
  );
}
