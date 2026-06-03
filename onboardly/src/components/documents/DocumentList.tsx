"use client";

import { useCallback, useState } from "react";
import { FileX2 } from "lucide-react";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import type { DocumentSummary } from "@/lib/documents/queries";

interface Props {
  projectId: string;
  isAdmin: boolean;
  initialDocs: DocumentSummary[];
  onMutated?: () => void;
}

export function DocumentList({ projectId, isAdmin, initialDocs, onMutated }: Props) {
  const [docs, setDocs] = useState<DocumentSummary[]>(initialDocs);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/documents?projectId=${projectId}`);
    if (res.ok) {
      const data = (await res.json()) as { documents: DocumentSummary[] };
      setDocs(data.documents);
    }
    onMutated?.();
  }, [projectId, onMutated]);

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <DocumentUpload projectId={projectId} onUploaded={refresh} />
      ) : null}

      {docs.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
          <FileX2 className="size-8 opacity-40" />
          <p className="text-sm">No documents uploaded yet.</p>
          {isAdmin ? (
            <p className="text-xs">Upload a PDF, Markdown, DOCX, or TXT file above.</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              projectId={projectId}
              isAdmin={isAdmin}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
