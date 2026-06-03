import { Badge } from "@/components/ui/badge";
import { ProjectRole } from "@/generated/prisma/enums";
import { Shield, User } from "lucide-react";

// Small presentational badge for a member's project role. Admin is emphasized
// (primary), members are muted (secondary).

export function RoleBadge({ role }: { role: ProjectRole }) {
  const isAdmin = role === ProjectRole.ADMIN;
  const Icon = isAdmin ? Shield : User;
  return (
    <Badge variant={isAdmin ? "default" : "secondary"}>
      <Icon />
      {isAdmin ? "Admin" : "Member"}
    </Badge>
  );
}
