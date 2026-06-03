import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MemberRow } from "@/components/members/MemberRow";
import type { RosterMember } from "@/types/member";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

// The project roster card — a list of ACTIVE members with their role and derived
// onboarding %. `canManage` (admin) toggles the per-row role/remove controls.
// `headerAction` is the admin "Add members" button (omitted for members).

export function MemberRoster({
  projectId,
  members,
  canManage,
  headerAction,
}: {
  projectId: string;
  members: RosterMember[];
  canManage: boolean;
  headerAction?: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary size-4" />
            Members
          </CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "person" : "people"} on
            this project.
          </CardDescription>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Add collaborators to start tracking onboarding progress."
          />
        ) : (
          <div className="divide-border divide-y">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                projectId={projectId}
                member={member}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
