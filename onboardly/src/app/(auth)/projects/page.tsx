// Projects list placeholder.

import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { mockProjects } from "@/data/mock/projects";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Projects</h1>
      {mockProjects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to connect a repo, sync Slack, and build its knowledge base."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
