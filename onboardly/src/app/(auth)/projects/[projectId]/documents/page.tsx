// Documents page for a project. Lists uploaded documents with download links.
// Admins see the upload control and per-doc delete. Members see list only.
// Access guard: any ACTIVE member can view; non-members get 404.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DocumentsCard } from "@/components/documents/DocumentsCard";
import { getProjectAccess } from "@/lib/members/access";
import { listDocuments } from "@/lib/documents/queries";
import { ProjectRole } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const access = await getProjectAccess(projectId);
  if (!access) notFound();

  const { project, role } = access;
  const isAdmin = role === ProjectRole.ADMIN;
  const docs = await listDocuments(projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/projects/${project.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {project.name}
        </Link>
        <h1 className="font-heading text-2xl font-semibold">Documents</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "Upload source docs to power the knowledge base."
            : "Company documents available for this project."}
        </p>
      </div>

      <DocumentsCard
        projectId={project.id}
        isAdmin={isAdmin}
        initialDocs={docs}
      />
    </div>
  );
}
