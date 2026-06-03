// Placeholder for the "Resources" surface (knowledge base / recommended docs).
// Real resources UI is a later slice; this keeps the sidebar link live.

import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function ResourcesPage() {
  return (
    <ComingSoon
      title="Resources"
      description="Docs, guides, and company knowledge to help you ramp up."
      icon={BookOpen}
    />
  );
}
