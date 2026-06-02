// Project members page — the roster (everyone on the project + their derived
// onboarding %) and, for admins, the "Add members" flow discovered from the
// repo's GitHub collaborators. ACTIVE members can view; only admins manage.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MemberRoster } from "@/components/members/MemberRoster";
import { AddMembersDialog } from "@/components/members/AddMembersDialog";
import { getProjectAccess } from "@/lib/members/access";
import { listMembers } from "@/lib/members/queries";
import { buildMemberCandidates } from "@/lib/members/candidates";
import { getProjectInstallationId } from "@/lib/github/installation";
import { getProjectConnection } from "@/lib/projects/connections";
import { ProjectRole, Provider } from "@/generated/prisma/enums";
import type { MemberCandidate } from "@/types/member";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const access = await getProjectAccess(projectId);
  if (!access) {
    notFound();
  }

  const isAdmin = access.role === ProjectRole.ADMIN;
  const members = await listMembers(projectId);

  // Build the "Add members" candidate list for admins. Discovery needs both a
  // parseable repo and a GitHub App installation; degrade with a clear reason
  // when either is missing (e.g. the repo isn't connected yet).
  let candidates: MemberCandidate[] = [];
  let disabledReason: string | undefined;
  if (isAdmin) {
    const githubConnection = await getProjectConnection(
      projectId,
      Provider.GITHUB,
    );
    if (!githubConnection?.externalRef) {
      disabledReason =
        "Connect a GitHub repository to discover members from its collaborators.";
    } else {
      const installationId = await getProjectInstallationId(projectId);
      if (!installationId) {
        disabledReason =
          "Install the Onboardly GitHub App on this repository to discover collaborators.";
      } else {
        try {
          candidates = await buildMemberCandidates(projectId, installationId);
        } catch {
          disabledReason =
            "Couldn't reach GitHub to list collaborators. Try again shortly.";
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Members</h1>
          <p className="text-muted-foreground text-sm">{access.project.name}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}`}>Back to project</Link>
        </Button>
      </div>

      <MemberRoster
        projectId={projectId}
        members={members}
        canManage={isAdmin}
        headerAction={
          isAdmin ? (
            <AddMembersDialog
              projectId={projectId}
              candidates={candidates}
              disabledReason={disabledReason}
            />
          ) : null
        }
      />
    </div>
  );
}
