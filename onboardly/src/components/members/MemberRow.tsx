"use client";

import * as React from "react";
import { Trash2, Shield, ShieldOff } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/members/RoleBadge";
import { MemberProgressBar } from "@/components/members/MemberProgressBar";
import { removeMember, setMemberRole } from "@/lib/members/actions";
import { ProjectRole } from "@/generated/prisma/enums";
import type { RosterMember } from "@/types/member";

// One roster row. Admins see role-toggle + remove controls; members see a
// read-only row. Actions call the server and the page revalidates. The last
// admin is protected server-side, so a failed action surfaces its message.

function initials(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

export function MemberRow({
  projectId,
  member,
  canManage,
}: {
  projectId: string;
  member: RosterMember;
  canManage: boolean;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Prefer a real name, then GitHub login, then email; only "Unknown" if we
  // truly have no identity (shouldn't happen for a signed-in user).
  const displayName =
    member.displayName ?? member.githubLogin ?? member.email ?? "Unknown";
  const isAdmin = member.role === ProjectRole.ADMIN;

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMember(projectId, member.id);
      if (!result.ok) setError(result.error);
    });
  }

  function handleToggleRole() {
    setError(null);
    const next = isAdmin ? ProjectRole.MEMBER : ProjectRole.ADMIN;
    startTransition(async () => {
      const result = await setMemberRole(projectId, member.id, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="hover:bg-muted/30 -mx-2 flex flex-col gap-3 rounded-xl px-2 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {/* Identity */}
      <div className="flex min-w-0 items-center gap-3">
        <Avatar>
          {member.avatarUrl ? (
            <AvatarImage src={member.avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback>{initials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {member.githubLogin ? (
            <p className="text-muted-foreground truncate text-xs">
              @{member.githubLogin}
            </p>
          ) : member.email && member.email !== displayName ? (
            <p className="text-muted-foreground truncate text-xs">
              {member.email}
            </p>
          ) : null}
        </div>
      </div>

      {/* Meta + actions */}
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:justify-end">
        <MemberProgressBar percent={member.onboardingPercent} />
        <RoleBadge role={member.role} />

        {canManage ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleToggleRole}
              disabled={isPending}
              title={isAdmin ? "Demote to member" : "Promote to admin"}
            >
              {isAdmin ? (
                <ShieldOff className="size-4" />
              ) : (
                <Shield className="size-4" />
              )}
              <span className="sr-only">
                {isAdmin ? "Demote to member" : "Promote to admin"}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
              title="Remove member"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove member</span>
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-destructive text-xs sm:basis-full sm:text-right">
          {error}
        </p>
      ) : null}
    </div>
  );
}
