// Project overview placeholder — knowledge base status + entry points
// to the course, chat, and admin surfaces.

import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const sections = [
    {
      href: `/projects/${projectId}/course`,
      title: "Onboarding course",
      description: "AI-generated modules, lessons, and quizzes.",
    },
    {
      href: `/projects/${projectId}/chat`,
      title: "Ask the knowledge base",
      description: "RAG chat with cited sources.",
    },
    {
      href: `/projects/${projectId}/admin`,
      title: "Admin",
      description: "Manage docs, integrations, and regeneration.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Project overview
        </h1>
        <p className="text-muted-foreground text-sm">Project: {projectId}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
