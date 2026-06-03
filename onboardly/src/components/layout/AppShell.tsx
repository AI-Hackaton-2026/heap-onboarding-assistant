// Shared authenticated app layout shell: header + sidebar + main content area.
// Fetches the signed-in user once and threads the identity to the sidebar
// (user chip at the bottom) and the header (mobile menu).

import type { ReactNode } from "react";
import { AuthHeader } from "./AuthHeader";
import { Sidebar } from "./Sidebar";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { createClient } from "@/lib/supabase/server";

/** Read a string field from the Supabase user_metadata, or null when absent. */
function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl = metaString(metadata, "avatar_url");
  const displayName =
    metaString(metadata, "name") ?? metaString(metadata, "full_name");

  return (
    <OnboardingProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <AuthHeader
          email={email}
          avatarUrl={avatarUrl}
          displayName={displayName}
        />
        <div className="flex min-h-0 flex-1">
          <Sidebar
            email={email}
            avatarUrl={avatarUrl}
            displayName={displayName}
          />
          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </main>
        </div>
      </div>
    </OnboardingProvider>
  );
}
