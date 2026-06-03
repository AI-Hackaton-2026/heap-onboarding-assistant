// Placeholder for the "My Plan" surface (full onboarding plan + tasks).
// Real plan UI is a later slice; this keeps the sidebar link live.

import { ListChecks } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function MyPlanPage() {
  return (
    <ComingSoon
      title="My Plan"
      description="Your full onboarding plan, day by day."
      icon={ListChecks}
    />
  );
}
