"use client";

// Read-only, project-grouped document list for the global Resources page.
// Reuses DocumentRow (download enabled, delete hidden since isAdmin=false).
// Data is fetched + paginated server-side; this component only renders.

import { FolderKanban } from "lucide-react";
import { DocumentRow } from "@/components/documents/DocumentRow";
import type { AccessibleDocument } from "@/lib/documents/aggregate";

interface Props {
  documents: AccessibleDocument[];
}

/** Group the flat document list by project, preserving newest-first order. */
function groupByProject(
  documents: AccessibleDocument[],
): { projectId: string; projectName: string; docs: AccessibleDocument[] }[] {
  const groups = new Map<
    string,
    { projectId: string; projectName: string; docs: AccessibleDocument[] }
  >();
  for (const doc of documents) {
    const existing = groups.get(doc.projectId);
    if (existing) {
      existing.docs.push(doc);
    } else {
      groups.set(doc.projectId, {
        projectId: doc.projectId,
        projectName: doc.projectName,
        docs: [doc],
      });
    }
  }
  return Array.from(groups.values());
}

export function ResourcesList({ documents }: Props) {
  const groups = groupByProject(documents);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.projectId} className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
            <FolderKanban className="size-3.5" />
            <span className="truncate">{group.projectName}</span>
          </div>
          <div className="space-y-2">
            {group.docs.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                projectId={doc.projectId}
                isAdmin={false}
                onDeleted={() => {}}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
