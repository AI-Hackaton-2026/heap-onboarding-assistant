"use client";

// Admin-only upload control. Uses the /api/documents/upload route via fetch so
// the file bytes never go through a server action (avoids the 4 MB body limit).

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPT = ".pdf,.md,.txt,.docx";

interface Props {
  projectId: string;
  onUploaded: () => void;
}

export function DocumentUpload({ projectId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("projectId", projectId);
      form.append("file", file);

      try {
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          errors.push(`${file.name}: ${body.error ?? "Upload failed"}`);
        }
      } catch {
        errors.push(`${file.name}: Network error`);
      }
    }

    setUploading(false);
    if (errors.length > 0) {
      setError(errors.join("\n"));
    } else {
      onUploaded();
    }
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        className="border-border hover:border-primary/60 hover:bg-muted/40 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        ) : (
          <Upload className="text-muted-foreground size-6" />
        )}
        <div>
          <p className="text-sm font-medium">
            {uploading ? "Uploading…" : "Click or drag to upload"}
          </p>
          <p className="text-muted-foreground text-xs">PDF, Markdown, DOCX, TXT · max 10 MB</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Choose files
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPT}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error ? (
        <p className="text-destructive whitespace-pre-line text-sm">{error}</p>
      ) : null}
    </div>
  );
}
