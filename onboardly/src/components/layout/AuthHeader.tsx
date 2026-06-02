// Header for authenticated pages. Reads the signed-in user and renders the
// user menu (identity + sign-out).

import Link from "next/link";
import { AppIcon } from "@/components/layout/AppIcon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "./UserMenu";
import { createClient } from "@/lib/supabase/server";

export async function AuthHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-border flex items-center justify-between border-b px-6 py-3">
      <Link
        href="/dashboard"
        className="font-heading flex items-center gap-2 text-base font-semibold"
      >
        <AppIcon className="size-7" />
        Onboardly
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu email={user?.email ?? null} />
      </div>
    </header>
  );
}
