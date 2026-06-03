// Settings — load and edit the current user's profile. Display name is editable
// (synced to Supabase user_metadata + the User row); email and GitHub identity
// are read-only. Server component loads the identity; the form is a client
// component using a server action.

import { redirect } from "next/navigation";
import { Settings as SettingsIcon, UserCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { Provider } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

/** Read a string field from Supabase user_metadata, or null when absent. */
function metaString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const email = user.email ?? null;
  const initialName =
    metaString(metadata, "name") ??
    metaString(metadata, "full_name") ??
    (email ? email.split("@")[0] : "");

  // GitHub login is the linked identity (read-only here).
  const identity = await prisma.userIdentity.findUnique({
    where: {
      userId_provider: { userId: user.id, provider: Provider.GITHUB },
    },
    select: { externalLogin: true },
  });
  const githubLogin =
    identity?.externalLogin ?? metaString(metadata, "user_name");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile and account details."
        icon={SettingsIcon}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCog className="text-primary size-4 shrink-0" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Update how your name appears across Onboardly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={initialName}
            email={email}
            githubLogin={githubLogin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
