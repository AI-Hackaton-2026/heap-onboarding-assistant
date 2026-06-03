// AI Assistant — global RAG chat. The chat API is project-scoped, so the page
// loads the user's accessible projects and lets the client pick which one's
// knowledge base to ask about. Server component: projects are access-guarded in
// the lib; the interactive chat lives in AssistantClient.

import Link from "next/link";
import { Sparkles, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { listAccessibleProjects } from "@/lib/members/queries";
import {
  AssistantClient,
  type AssistantProject,
} from "./AssistantClient";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const accessible = await listAccessibleProjects();
  const projects: AssistantProject[] = accessible.map(({ project }) => ({
    id: project.id,
    name: project.name,
  }));

  const header = (
    <PageHeader
      title="AI Assistant"
      subtitle="Ask questions and get answers grounded in your company's docs — with citations."
      icon={Sparkles}
    />
  );

  if (projects.length === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {header}
        <EmptyState
          icon={FolderKanban}
          title="No projects to ask about"
          description="The assistant answers from a project's knowledge base. Join or create a project, connect its sources, then come back to chat."
          action={
            <Button asChild>
              <Link href="/projects">Go to Projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-6xl">{header}</div>
      <AssistantClient projects={projects} />
    </div>
  );
}
