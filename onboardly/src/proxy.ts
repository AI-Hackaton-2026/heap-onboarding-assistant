// Root proxy (Next.js 16, formerly `middleware.ts`) — runs on every matched
// request to refresh the Supabase session and enforce route protection
// (see src/lib/supabase/middleware.ts). Runtime is nodejs.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
