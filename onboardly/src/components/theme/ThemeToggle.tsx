"use client";

// Reusable light/dark toggle button. Uses the ThemeProvider context.
// Renders a stable placeholder until hydrated to avoid a hydration mismatch
// (the resolved theme isn't known on the server). useSyncExternalStore returns
// the server snapshot (false) during SSR and the client snapshot (true) after,
// which is the hydration-safe way to detect mount without setState-in-effect.

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme/ThemeProvider";

const emptySubscribe = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = theme === "dark";

  // Until hydrated, the resolved theme isn't known on the server, so keep the
  // label generic and the icon stable to avoid a hydration mismatch.
  const label = !hydrated
    ? "Toggle theme"
    : isDark
      ? "Switch to light mode"
      : "Switch to dark mode";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={label}
        >
          {hydrated && isDark ? <Moon /> : <Sun />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
