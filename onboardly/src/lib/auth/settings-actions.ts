// Settings server actions — update the current user's editable profile fields
// (display name). Keeps Supabase auth user_metadata and the app-owned User row in
// sync so the name shows consistently across the shell, roster, and overview.
// Email / GitHub identity are read-only here (managed by the auth provider).

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export type SettingsActionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

const MAX_NAME_LENGTH = 80;

/**
 * Update the signed-in user's display name. Writes to Supabase user_metadata
 * (so the session/JWT reflects it) and the Prisma User row (so server reads and
 * the member directory stay consistent). Validates + trims input.
 */
export async function updateDisplayName(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const raw = String(formData.get("displayName") ?? "").trim();

  if (!raw) {
    return { ok: false, error: "Display name cannot be empty." };
  }
  if (raw.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: `Display name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to update settings." };
  }

  const { error } = await supabase.auth.updateUser({
    data: { name: raw },
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  // Mirror onto the app-owned User row (best-effort — auth metadata is the
  // source the shell reads from, but keep the directory in sync).
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { displayName: raw },
    });
  } catch {
    // The User row may not exist yet for brand-new sessions; non-fatal.
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile updated." };
}
