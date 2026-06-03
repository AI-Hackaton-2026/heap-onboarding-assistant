// Resources — every document the user can access across their projects, newest
// first, grouped by project and paginated. Read-only view (download enabled,
// no delete). Server component: data is aggregated + access-guarded in the lib.

import Link from "next/link";
import {
  BookOpen,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResourcesList } from "@/components/documents/ResourcesList";
import { listAccessibleDocuments } from "@/lib/documents/aggregate";

// User-specific data — always render fresh.
export const dynamic = "force-dynamic";

interface ResourcesPageProps {
  searchParams: Promise<{ page?: string }>;
}

/** Parse a 1-based page number from the query string, defaulting to 1. */
function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const { page: rawPage } = await searchParams;
  const result = await listAccessibleDocuments(parsePage(rawPage));

  const header = (
    <PageHeader
      title="Resources"
      subtitle="Docs, guides, and company knowledge across your projects."
      icon={BookOpen}
    />
  );

  // No projects → nudge toward Projects.
  if (result.hasNoProjects) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {header}
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Resources live inside your projects. Join or create one to see its documents here."
          action={
            <Button asChild>
              <Link href="/projects">Go to Projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Projects but no documents.
  if (result.total === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {header}
        <EmptyState
          icon={BookOpen}
          title="No documents yet"
          description="When documents are uploaded to your projects, they'll show up here for you to read and download."
          action={
            <Button asChild variant="outline">
              <Link href="/projects">Browse projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {header}

      <ResourcesList documents={result.documents} />

      {result.totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3"
          aria-label="Resources pagination"
        >
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/resources?page=${result.page - 1}`}>
                <ChevronLeft />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft />
              Previous
            </Button>
          )}

          <span className="text-muted-foreground text-sm">
            Page {result.page} of {result.totalPages}
          </span>

          {result.page < result.totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/resources?page=${result.page + 1}`}>
                Next
                <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight />
            </Button>
          )}
        </nav>
      ) : null}
    </div>
  );
}
