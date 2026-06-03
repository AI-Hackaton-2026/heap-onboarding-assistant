"use client";

// Deletes a project after a confirm prompt. Submits to the deleteProject server
// action via a form so it works without extra client state; the confirm guards
// against accidental deletion (cascades to the project's docs, courses, chats).

import { deleteProject } from "@/lib/projects/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return (
    <form
      action={deleteProject}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete “${projectName}”? This also removes its documents, courses, and chats. This can't be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
    </form>
  );
}
