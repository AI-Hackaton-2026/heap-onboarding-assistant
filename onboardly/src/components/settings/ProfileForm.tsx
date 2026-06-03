"use client";

// Editable profile form for Settings. Only the display name is editable here;
// email + GitHub identity are read-only (managed by the auth provider) and shown
// for reference. Uses useActionState to surface the server action's result.

import { useActionState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateDisplayName,
  type SettingsActionState,
} from "@/lib/auth/settings-actions";

interface Props {
  initialName: string;
  email: string | null;
  githubLogin: string | null;
}

export function ProfileForm({ initialName, email, githubLogin }: Props) {
  const [state, action, pending] = useActionState<
    SettingsActionState,
    FormData
  >(updateDisplayName, undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialName}
          maxLength={80}
          required
          autoComplete="name"
        />
        <p className="text-muted-foreground text-xs">
          Shown across your workspace — the sidebar, project roster, and overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email ?? "—"}
            readOnly
            disabled
            aria-readonly
          />
          <p className="text-muted-foreground text-xs">
            Managed by your sign-in provider.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="githubLogin">GitHub</Label>
          <Input
            id="githubLogin"
            value={githubLogin ? `@${githubLogin}` : "Not linked"}
            readOnly
            disabled
            aria-readonly
          />
          <p className="text-muted-foreground text-xs">
            Linked when you sign in with GitHub.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
        {state?.ok ? (
          <span className="text-success flex items-center gap-1 text-sm">
            <Check className="size-4" />
            {state.message}
          </span>
        ) : null}
        {state && !state.ok ? (
          <span className="text-destructive text-sm">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
