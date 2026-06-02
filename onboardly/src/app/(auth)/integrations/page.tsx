// Integrations overview placeholder — GitHub and Slack connection state.

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "GitHub",
      description: "Sync repositories into the knowledge base.",
    },
    { name: "Slack", description: "Sync channels and threads for context." },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Integrations</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader>
              <CardTitle>{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
              <Badge className="mt-2 w-fit" variant="outline">
                Not connected
              </Badge>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
