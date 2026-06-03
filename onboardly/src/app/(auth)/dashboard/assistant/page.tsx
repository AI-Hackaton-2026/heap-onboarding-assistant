// Placeholder for the "AI Assistant" surface (RAG chat with citations).
// Real assistant UI is a later slice; this keeps the sidebar link live.

import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

export default function AssistantPage() {
  return (
    <ComingSoon
      title="AI Assistant"
      description="Ask questions and get answers grounded in your company's docs."
      icon={Sparkles}
    />
  );
}
