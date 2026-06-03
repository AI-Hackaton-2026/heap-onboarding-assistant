// "Add members" candidate list — repo collaborators ∩ Onboardly users.
//
// Discovery = the project repo's collaborators (see github/collaborators.ts).
// We intersect them with UserIdentity by GitHub login (lowercased join key)
// and annotate each so the dialog can show who's addable vs. greyed-out:
//   - addable:       has an Onboardly profile, not already an ACTIVE member.
//   - alreadyMember: already an ACTIVE member of this project.
//   - noAccount:     a collaborator with no Onboardly account (greyed, info-only).
//   - self:          the current admin themselves (excluded from adding).
//
// Members must already have an Onboardly account (with GitHub connected) this
// slice — there's no invite/pre-signup. Collaborators without an identity show
// as "No Onboardly account."

import { prisma } from "@/lib/db/prisma";
import { getProjectAccess, getCurrentUserId } from "@/lib/members/access";
import {
  listRepoCollaborators,
  parseRepoRef,
} from "@/lib/github/collaborators";
import { getProjectConnection } from "@/lib/projects/connections";
import { MemberStatus, Provider } from "@/generated/prisma/enums";
import type { MemberCandidate } from "@/types/member";

/**
 * Build the annotated candidate list for a project's "Add members" dialog.
 * Caller must be able to access the project (we re-check). Returns an empty list
 * when the repo isn't parseable or has no collaborators. Throws only on a GitHub
 * connection error from listRepoCollaborators (callers surface it to the UI).
 *
 * `installationId` is the GitHub App installation for this project's repo; it
 * comes from the project's GitHub integration once the Phase-3 install flow
 * persists it. Discovery can't run without it.
 */
export async function buildMemberCandidates(
  projectId: string,
  installationId: string | number,
): Promise<MemberCandidate[]> {
  const access = await getProjectAccess(projectId);
  if (!access) return [];

  const connection = await getProjectConnection(projectId, Provider.GITHUB);
  const repoRef = parseRepoRef(connection?.externalRef ?? null);
  if (!repoRef) return [];

  const collaborators = await listRepoCollaborators(
    repoRef.owner,
    repoRef.repo,
    installationId,
  );
  if (collaborators.length === 0) return [];

  const logins = collaborators.map((c) => c.login);

  // Onboardly users matching those logins (login is stored lowercased).
  const identities = await prisma.userIdentity.findMany({
    where: {
      provider: Provider.GITHUB,
      externalLogin: { in: logins },
    },
    select: {
      userId: true,
      externalLogin: true,
      user: { select: { displayName: true, email: true } },
    },
  });
  const identityByLogin = new Map(
    identities.map((identity) => [identity.externalLogin, identity]),
  );

  // Active members of this project (to mark "alreadyMember"), keyed by userId.
  const activeMembers = await prisma.projectMember.findMany({
    where: { projectId, status: MemberStatus.ACTIVE },
    select: { userId: true },
  });
  const activeUserIds = new Set(activeMembers.map((m) => m.userId));

  // The admin doing the adding — excluded (can't add yourself).
  const currentUserId = await getCurrentUserId();

  return collaborators.map((collaborator) => {
    const identity = identityByLogin.get(collaborator.login);

    if (!identity) {
      return {
        githubLogin: collaborator.login,
        avatarUrl: collaborator.avatarUrl,
        onboardlyUser: null,
        state: "noAccount" as const,
      };
    }

    const onboardlyUser = {
      userId: identity.userId,
      displayName: identity.user.displayName,
      email: identity.user.email,
    };

    let state: MemberCandidate["state"];
    if (currentUserId && identity.userId === currentUserId) {
      state = "self";
    } else if (activeUserIds.has(identity.userId)) {
      state = "alreadyMember";
    } else {
      state = "addable";
    }

    return {
      githubLogin: collaborator.login,
      avatarUrl: collaborator.avatarUrl,
      onboardlyUser,
      state,
    };
  });
}
