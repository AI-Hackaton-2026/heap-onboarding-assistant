"use client";

// Client-side onboarding context for the authenticated shell. Provides a
// `startTour` action (used by the help button) and auto-opens the walkthrough
// the first time a user lands on a "main" page.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { OnboardingTour } from "./OnboardingTour";
import { hasSeenTour, markTourSeen } from "@/lib/onboarding";

interface OnboardingContextValue {
  /** Open the walkthrough from the start (e.g. the help button). */
  startTour: () => void;
  isActive: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  const startTour = useCallback(() => setIsActive(true), []);

  const finishTour = useCallback(() => {
    setIsActive(false);
    markTourSeen();
  }, []);

  // First-run trigger: open once after mount so the header/sidebar anchors have
  // rendered and their positions are measurable. Kept in an effect (client-only)
  // to avoid reading localStorage during SSR.
  useEffect(() => {
    if (hasSeenTour()) return;
    const timer = window.setTimeout(() => setIsActive(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <OnboardingContext.Provider value={{ startTour, isActive }}>
      {children}
      {isActive ? <OnboardingTour onClose={finishTour} /> : null}
    </OnboardingContext.Provider>
  );
}
