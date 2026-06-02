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
    "Resync GitHub",
    "Resync Slack",
    "Regenerate course",
    "Rebuild knowledge base",
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Knowledge base</CardTitle>
          <CardDescription>
            GitHub, Slack, embedding, and course-generation status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {controls.map((label) => (
            <Button key={label} variant="outline" size="sm" disabled>
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
