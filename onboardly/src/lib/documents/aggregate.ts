// Cross-project document aggregation for the global Resources page. The
// per-project listDocuments() is the access-guarded source of truth; this rolls
// documents up across every project the user is an ACTIVE member of and paginates
// the flat list. Access is enforced because we only ever read projects returned
// by listAccessibleProjects() (the caller's own memberships).

import { listAccessibleProjects } from "@/lib/members/queries";
import { listDocuments, type DocumentSummary } from "@/lib/documents/queries";

/** A document plus the project it belongs to (for grouping + download links). */
export interface AccessibleDocument extends DocumentSummary {
  projectId: string;
  projectName: string;
}

/** A single page of the aggregated document list. */
export interface DocumentPage {
  documents: AccessibleDocument[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNoProjects: boolean;
}

export const DOCUMENTS_PAGE_SIZE = 10;

/**
 * List the current user's documents across all accessible projects, newest
 * first, paginated. Returns a render-safe empty page when the user has no
 * projects or no documents. `page` is 1-based and clamped to the valid range.
 */
export async function listAccessibleDocuments(
  page = 1,
  pageSize = DOCUMENTS_PAGE_SIZE,
): Promise<DocumentPage> {
  const projects = await listAccessibleProjects();

  if (projects.length === 0) {
    return {
      documents: [],
      page: 1,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNoProjects: true,
    };
  }

  // Fetch each project's documents in parallel, then flatten with project context.
  const perProject = await Promise.all(
    projects.map(async ({ project }) => {
      const docs = await listDocuments(project.id);
      return docs.map<AccessibleDocument>((doc) => ({
        ...doc,
        projectId: project.id,
        projectName: project.name,
      }));
    }),
  );

  const all = perProject
    .flat()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const documents = all.slice(start, start + pageSize);

  return {
    documents,
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasNoProjects: false,
  };
}
