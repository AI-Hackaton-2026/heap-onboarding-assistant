import { Badge } from "@/components/ui/badge";
import { ProjectRole } from "@/generated/prisma/enums";

// Small presentational badge for a member's project role. Admin is emphasized
// (primary), members are muted (secondary).

export function RoleBadge({ role }: { role: ProjectRole }) {
  const isAdmin = role === ProjectRole.ADMIN;
  return (
    <Badge variant={isAdmin ? "default" : "secondary"}>
      {isAdmin ? "Admin" : "Member"}
    </Badge>
  );
}
