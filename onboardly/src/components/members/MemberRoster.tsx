import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MemberRow } from "@/components/members/MemberRow";
import type { RosterMember } from "@/types/member";

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
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "person" : "people"} on this
            project.
          </CardDescription>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">No members yet.</p>
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
