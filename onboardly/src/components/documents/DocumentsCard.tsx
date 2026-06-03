"use client";

// Client wrapper that owns the mutation counter shared by DocumentList and
// EmbedButton, and positions the button in the card header on the right.

import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentList } from "@/components/documents/DocumentList";
import { EmbedButton } from "@/components/documents/EmbedButton";
import type { DocumentSummary } from "@/lib/documents/queries";

interface Props {
  projectId: string;
  isAdmin: boolean;
  initialDocs: DocumentSummary[];
}

export function DocumentsCard({ projectId, isAdmin, initialDocs }: Props) {
  const [mutationCount, setMutationCount] = useState(0);
  const handleMutated = useCallback(() => setMutationCount((n) => n + 1), []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Accepted formats: PDF, Markdown, DOCX, TXT. Max 10 MB per file.
            </CardDescription>
          </div>
          {isAdmin ? (
            <EmbedButton projectId={projectId} refreshTrigger={mutationCount} />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <DocumentList
          projectId={projectId}
          isAdmin={isAdmin}
          initialDocs={initialDocs}
          onMutated={handleMutated}
        />
      </CardContent>
    </Card>
  );
}
