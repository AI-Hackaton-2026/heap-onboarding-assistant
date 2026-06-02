// RAG chat page. Access is checked on the server before the interactive client
// is rendered so admins and active members can chat, while strangers get a 404.

import { notFound } from "next/navigation";
import { ChatClient } from "./ChatClient";
import { getProjectAccess } from "@/lib/members/access";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!(await getProjectAccess(projectId))) {
    notFound();
  }

  return <ChatClient projectId={projectId} />;
}
