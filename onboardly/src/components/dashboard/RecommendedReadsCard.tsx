// "Recommended next reads" card — resource rows, each a link with a leading
// document icon, a title + subtitle, and a trailing chevron. Footer links to
// all resources.

import Link from "next/link";
import { BookOpen, FileText, ChevronRight } from "lucide-react";
import type { RecommendedRead } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";

export function RecommendedReadsCard({ reads }: { reads: RecommendedRead[] }) {
  return (
    <DashboardCard
      title="Recommended next reads"
      icon={BookOpen}
      footerHref="/dashboard/resources"
      footerLabel="View all resources"
    >
      <ul className="flex flex-col gap-1">
        {reads.map((read) => (
          <li key={read.id}>
            <Link
              href={read.href}
              className="hover:bg-muted/60 group/read -mx-2 flex items-center gap-3 rounded-md px-2 py-2"
            >
              <FileText className="text-muted-foreground size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{read.title}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {read.subtitle}
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
