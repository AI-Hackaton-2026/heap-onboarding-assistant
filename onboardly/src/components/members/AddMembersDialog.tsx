"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { addMembers } from "@/lib/members/actions";
import type { MemberCandidate } from "@/types/member";

// Admin-only dialog to add developers discovered from the repo's collaborators.
// Addable candidates are selectable; already-members and no-account collaborators
// are shown greyed-out for context. Selection is by Onboardly userId.

function initials(name: string | null, login: string): string {
  const base = name ?? login;
  return base.slice(0, 2).toUpperCase();
}

export function AddMembersDialog({
  projectId,
  candidates,
  disabledReason,
}: {
  projectId: string;
  candidates: MemberCandidate[];
  /** When set, discovery isn't available (e.g. no repo/installation) — explain why. */
  disabledReason?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const addable = candidates.filter((c) => c.state === "addable");
  const others = candidates.filter((c) => c.state !== "addable");

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleAdd() {
    setError(null);
    const userIds = [...selected];
    if (userIds.length === 0) {
      setError("Select at least one person to add.");
      return;
    }
    startTransition(async () => {
      const result = await addMembers(projectId, userIds);
      if (result.ok) {
        setSelected(new Set());
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" />
          Add members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
          <DialogDescription>
            Developers discovered from this project&apos;s GitHub repo
            collaborators. Only those with an Onboardly account can be added.
          </DialogDescription>
        </DialogHeader>

        {disabledReason ? (
          <p className="text-muted-foreground py-4 text-sm">{disabledReason}</p>
        ) : candidates.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            No collaborators found for this repository.
          </p>
        ) : (
          <div className="space-y-4">
            {addable.length > 0 ? (
              <ul className="space-y-1">
                {addable.map((c) => {
                  const userId = c.onboardlyUser!.userId;
                  const name = c.onboardlyUser!.displayName;
                  const checked = selected.has(userId);
                  return (
                    <li key={c.githubLogin}>
                      <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md p-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(userId)}
                        />
                        <Avatar className="size-7">
                          {c.avatarUrl ? (
                            <AvatarImage src={c.avatarUrl} alt={c.githubLogin} />
                          ) : null}
                          <AvatarFallback>
                            {initials(name, c.githubLogin)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {name ?? c.githubLogin}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            @{c.githubLogin}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                Everyone with an Onboardly account is already a member.
              </p>
            )}

            {others.length > 0 ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  Not addable
                </p>
                <ul className="space-y-1">
                  {others.map((c) => (
                    <li
                      key={c.githubLogin}
                      className="flex items-center gap-3 rounded-md p-2 opacity-60"
                    >
                      <Avatar className="size-7">
                        {c.avatarUrl ? (
                          <AvatarImage src={c.avatarUrl} alt={c.githubLogin} />
                        ) : null}
                        <AvatarFallback>
                          {initials(
                            c.onboardlyUser?.displayName ?? null,
                            c.githubLogin,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm">
                          @{c.githubLogin}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {c.state === "alreadyMember"
                            ? "Already a member"
                            : c.state === "self"
                              ? "You"
                              : "No Onboardly account"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={isPending || selected.size === 0 || !!disabledReason}
          >
            {isPending
              ? "Adding…"
              : `Add${selected.size > 0 ? ` ${selected.size}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
