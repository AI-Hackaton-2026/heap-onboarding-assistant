// GitHub App installation callback (Setup URL).
//
// After a user installs/configures the Onboardly GitHub App, GitHub redirects
// here with `installation_id` and `setup_action` (install | update | request).
// This is the App-installation flow — distinct from Supabase OAuth *login*
// (which goes to the Supabase /auth/v1/callback, not here).
//
// We optionally tie the installation to a project: the members page links to the
// install URL with `?state=<projectId>`, and on return we persist the
// installation id onto that project's GitHub connection so collaborator
// discovery uses the stored id directly. Without a usable `state` we just send
// the user back to integrations; the install still took effect on GitHub.

import { NextRequest, NextResponse } from "next/server";
import { requireProjectAdmin } from "@/lib/members/access";
import { saveProjectInstallationId } from "@/lib/github/installation";

// UUID v4-ish shape, matching the project ids we generate.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const installationId = params.get("installation_id");
  const setupAction = params.get("setup_action");
  const state = params.get("state");

  // GitHub sends `setup_action=request` when an org member requests an install
  // an admin must approve — no installation id yet, so there's nothing to store.
  if (setupAction === "request" || !installationId) {
    return NextResponse.redirect(new URL("/integrations", request.url));
  }

  // If the install was launched from a specific project (state = projectId),
  // attach the installation to that project's GitHub connection. We verify the
  // caller is an admin of that project before writing.
  if (state && UUID_RE.test(state)) {
    const access = await requireProjectAdmin(state);
    if (access) {
      await saveProjectInstallationId(state, installationId);
      return NextResponse.redirect(
        new URL(`/projects/${state}/members`, request.url),
      );
    }
    // Not an admin (or not signed in) — fall through to a generic landing.
  }

  return NextResponse.redirect(new URL("/integrations", request.url));
}
