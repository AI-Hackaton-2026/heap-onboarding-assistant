// Membership view-model types. These shape what the members data layer returns
// to the UI; the Prisma models (ProjectMember, UserProfile, LessonProgress) are
// the DB source of truth. Enum values mirror Prisma's ProjectRole / MemberStatus
// — import the runtime enums from "@/generated/prisma/enums" in client code to
// keep the full Prisma client out of the bundle (per the Phase-2 pattern).

import type { Project } from "@/generated/prisma/client";
import type { ProjectRole, MemberStatus } from "@/generated/prisma/enums";

/**
 * Result of an access check for a project. `null` means no access (→ notFound).
 * Org owner ⇒ effective role ADMIN; an ACTIVE member ⇒ their stored role.
 */
export interface ProjectAccess {
  project: Project;
  role: ProjectRole;
}

/** A project in the caller's accessible list, tagged with their effective role. */
export interface AccessibleProject {
  project: Project;
  role: ProjectRole;
}

/** A single row in the project roster (derived onboarding % included). */
export interface RosterMember {
  id: string;
  userId: string;
  email: string | null;
  githubLogin: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: ProjectRole;
  status: MemberStatus;
  joinedAt: string | null;
  /** Derived completion %, 0–100. Null ⇒ "Not started" (no course / 0 lessons). */
  onboardingPercent: number | null;
}

/** The Onboardly user matched to a GitHub collaborator, if one exists. */
export interface CandidateOnboardlyUser {
  userId: string;
  displayName: string | null;
  email: string | null;
}

/**
 * A repo collaborator surfaced in the "Add members" dialog, annotated with
 * whether they can be added.
 *  - addable: has an Onboardly profile and isn't already an ACTIVE member.
 *  - alreadyMember: an ACTIVE member of this project already.
 *  - noAccount: no Onboardly profile (greyed-out, informational).
 *  - self: the current admin themselves (excluded from adding).
 */
export interface MemberCandidate {
  githubLogin: string;
  avatarUrl: string | null;
  onboardlyUser: CandidateOnboardlyUser | null;
  state: "addable" | "alreadyMember" | "noAccount" | "self";
}
