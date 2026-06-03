"use client";

// Question-mark button that lives next to the theme toggle in the header and
// re-runs the onboarding walkthrough. Matches ThemeToggle's ghost icon styling.

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOnboarding } from "./OnboardingProvider";

export function HelpButton() {
  const { startTour } = useOnboarding();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={startTour}
          aria-label="Take a quick tour"
          data-tour="help"
        >
          <CircleHelp />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Take a quick tour</TooltipContent>
    </Tooltip>
  );
}
