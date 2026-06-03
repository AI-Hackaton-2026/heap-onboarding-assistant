"use client";

// One row in the document list. Shows file type, name, chunk count, upload
// date, a download button, and (for admins) a delete button.

import { useState } from "react";
import { FileText, Download, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteDocument } from "@/lib/documents/actions";
import type { DocumentSummary } from "@/lib/documents/queries";

function mimeLabel(mime: string | null, title: string | null): string {
  if (!mime) return "File";
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("wordprocessingml")) return "DOCX";
  if (mime.includes("markdown") || title?.endsWith(".md")) return "MD";
  return "TXT";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

interface Props {
  doc: DocumentSummary;
  projectId: string;
  isAdmin: boolean;
  onDeleted: () => void;
}

export function DocumentRow({ doc, projectId, isAdmin, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    const result = await deleteDocument(projectId, doc.id);
    setDeleting(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      onDeleted();
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documents/download?projectId=${projectId}&documentId=${doc.id}`,
      );
      if (!res.ok) throw new Error("Could not get download link.");
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="bg-card border-border flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <FileText className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{doc.title ?? "Untitled"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {mimeLabel(doc.mimeType, doc.title)}
            </Badge>
            {!doc.hasText ? (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <AlertCircle className="size-3" />
                No text extracted
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {doc.chunkCount} chunk{doc.chunkCount !== 1 ? "s" : ""}
              </span>
            )}
            <span className="text-muted-foreground text-xs">{formatDate(doc.createdAt)}</span>
          </div>
          {error ? (
            <p className="text-destructive mt-1 text-xs">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {doc.storagePath ? (
          <Button
            size="sm"
            variant="outline"
            disabled={downloading}
            onClick={handleDownload}
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span className="sr-only sm:not-sr-only sm:ml-1.5">Download</span>
          </Button>
        ) : null}
        {isAdmin ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={deleting}
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span className="sr-only">Delete</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
