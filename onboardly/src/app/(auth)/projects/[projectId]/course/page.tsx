// Generated onboarding course placeholder — renders modules/lessons from mock data.

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockCourse } from "@/data/mock/course";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {mockCourse.roleName} onboarding
        </h1>
        {mockCourse.estimatedDuration ? (
          <p className="text-muted-foreground text-sm">
            Estimated: {mockCourse.estimatedDuration}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">
        {mockCourse.modules.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{lesson.title}</span>
                  <Badge variant="outline">
                    {lesson.checklist.length} tasks
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
