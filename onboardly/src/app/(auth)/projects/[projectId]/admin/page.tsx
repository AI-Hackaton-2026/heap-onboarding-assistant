// Admin / project management placeholder — knowledge base status + controls
// (resync GitHub/Slack, regenerate course, rebuild knowledge base). Admin-only:
// members 404 here.

import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireProjectAdmin } from "@/lib/members/access";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Database,
  FolderGit2,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  Settings,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const access = await requireProjectAdmin(projectId);
  if (!access) {
    notFound();
  }

  const controls = [
    { label: "Resync GitHub", icon: FolderGit2 },
    { label: "Resync Slack", icon: MessageSquare },
    { label: "Regenerate course", icon: GraduationCap },
    { label: "Rebuild knowledge base", icon: RefreshCw },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Admin"
        subtitle={`Manage knowledge and generation controls for ${access.project.name}.`}
        icon={Settings}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="text-primary size-4" />
            Knowledge base
          </CardTitle>
          <CardDescription>
            GitHub, Slack, embedding, and course-generation status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {controls.map(({ label, icon: Icon }) => (
            <Button key={label} variant="outline" size="sm" disabled>
              <Icon className="size-4" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
