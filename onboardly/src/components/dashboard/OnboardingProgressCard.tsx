// "My onboarding progress" card — a vertical timeline of onboarding steps with
// a connector line, a leading status icon, and a right-aligned status label
// (Completed / In progress / Up next). Footer links to the full plan.

import type { OnboardingStep } from "@/types/dashboard";
import { DashboardCard } from "./DashboardCard";
import { StatusIcon, StatusLabel } from "./status";

export function OnboardingProgressCard({
  steps,
}: {
  steps: OnboardingStep[];
}) {
  return (
    <DashboardCard
      title="My onboarding progress"
      footerHref="/dashboard/plan"
      footerLabel="View full plan"
    >
      <ul className="flex flex-col">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center self-stretch">
                <StatusIcon status={step.status} />
                {!isLast ? (
                  <span className="bg-border w-px flex-1" aria-hidden />
                ) : null}
              </div>
              <div
                className={`flex flex-1 items-center justify-between gap-2 ${
                  isLast ? "" : "pb-4"
                }`}
              >
                <span className="text-sm font-medium">{step.title}</span>
                <StatusLabel status={step.status} />
              </div>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
