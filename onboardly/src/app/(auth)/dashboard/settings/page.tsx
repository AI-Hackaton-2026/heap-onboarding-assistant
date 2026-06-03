// Placeholder for the "Settings" surface (profile / preferences).
// Real settings UI is a later slice; this keeps the sidebar link live.

import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Manage your profile and onboarding preferences."
      icon={Settings}
    />
  );
}
