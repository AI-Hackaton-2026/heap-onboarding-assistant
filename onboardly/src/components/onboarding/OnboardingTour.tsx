"use client";

// The first-run walkthrough overlay. Dims the page with four solid panels around
// the current step's anchor (a reliable "spotlight" cut-out that never bleeds
// through), draws a primary highlight ring around it, and shows an opaque card
// explaining the step. Styling follows the app's shadcn / Violet Bloom tokens.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOUR_STEPS, type TourPlacement, type TourStep } from "@/lib/onboarding";

const SPOTLIGHT_PADDING = 6;
const CARD_GAP = 14;
const VIEWPORT_MARGIN = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findTarget(step: TourStep): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(
    `[data-tour="${step.target}"]`,
  );
  if (!el) return null;
  // Skip anchors that are hidden (e.g. sidebar / search collapse on mobile).
  if (el.offsetParent === null && el.getClientRects().length === 0) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return el;
}

function rectOf(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardingTour({ onClose }: { onClose: () => void }) {
  // Resolve which steps actually have a visible anchor in the current viewport.
  // Computed once on mount (the tour only ever renders on the client, after the
  // header/sidebar anchors have painted), reading the DOM rather than state.
  const [steps] = useState<TourStep[]>(() =>
    TOUR_STEPS.filter((s) => findTarget(s) !== null),
  );
  const [index, setIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const total = steps.length;
  const isLast = index === total - 1;

  // Nothing to highlight (e.g. a very small viewport) — finish immediately.
  useEffect(() => {
    if (steps.length === 0) onClose();
  }, [steps, onClose]);

  // Track the current target's rect, keeping it in sync on scroll/resize.
  useLayoutEffect(() => {
    if (!step) return;
    const el = findTarget(step);
    // Bring the anchor into view (e.g. a sidebar item below the fold) once.
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });

    let frame = 0;
    const update = () => {
      const current = findTarget(step);
      setTargetRect(current ? rectOf(current) : null);
    };
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [step]);

  // Position the card next to the target, picking a side that fits the viewport.
  useLayoutEffect(() => {
    if (!targetRect || !cardRef.current) return;
    const card = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const preferred: TourPlacement = step?.placement ?? "bottom";

    const fits = (placement: TourPlacement): boolean => {
      switch (placement) {
        case "bottom":
          return (
            targetRect.top + targetRect.height + CARD_GAP + card.height <= vh
          );
        case "top":
          return targetRect.top - CARD_GAP - card.height >= 0;
        case "right":
          return (
            targetRect.left + targetRect.width + CARD_GAP + card.width <= vw
          );
        case "left":
          return targetRect.left - CARD_GAP - card.width >= 0;
      }
    };

    const fallbacks: Record<TourPlacement, TourPlacement[]> = {
      bottom: ["bottom", "top", "right", "left"],
      top: ["top", "bottom", "right", "left"],
      right: ["right", "left", "bottom", "top"],
      left: ["left", "right", "bottom", "top"],
    };
    const placement = fallbacks[preferred].find((p) => fits(p)) ?? preferred;

    let top = 0;
    let left = 0;
    switch (placement) {
      case "bottom":
        top = targetRect.top + targetRect.height + CARD_GAP;
        left = targetRect.left + targetRect.width / 2 - card.width / 2;
        break;
      case "top":
        top = targetRect.top - CARD_GAP - card.height;
        left = targetRect.left + targetRect.width / 2 - card.width / 2;
        break;
      case "right":
        left = targetRect.left + targetRect.width + CARD_GAP;
        top = targetRect.top + targetRect.height / 2 - card.height / 2;
        break;
      case "left":
        left = targetRect.left - CARD_GAP - card.width;
        top = targetRect.top + targetRect.height / 2 - card.height / 2;
        break;
    }

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);
    left = clamp(left, VIEWPORT_MARGIN, vw - card.width - VIEWPORT_MARGIN);
    top = clamp(top, VIEWPORT_MARGIN, vh - card.height - VIEWPORT_MARGIN);

    setCardPos({ top, left });
  }, [targetRect, step, index]);

  const goNext = useCallback(() => {
    if (isLast) {
      onClose();
      return;
    }
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [isLast, onClose, total]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  if (!step) return null;

  // The padded "hole" around the highlighted element.
  const hole = targetRect
    ? {
        top: Math.max(targetRect.top - SPOTLIGHT_PADDING, 0),
        left: Math.max(targetRect.left - SPOTLIGHT_PADDING, 0),
        width: targetRect.width + SPOTLIGHT_PADDING * 2,
        height: targetRect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  const dimClass =
    "absolute bg-black/60 transition-all duration-200 ease-out";

  const overlay = (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding walkthrough"
    >
      {hole ? (
        <>
          {/* Four solid panels framing the highlighted element. Clicking any of
              them (i.e. outside the spotlight) dismisses the tour. */}
          <div
            className={dimClass}
            style={{ top: 0, left: 0, right: 0, height: hole.top }}
            onClick={onClose}
            aria-hidden
          />
          <div
            className={dimClass}
            style={{
              top: hole.top + hole.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onClick={onClose}
            aria-hidden
          />
          <div
            className={dimClass}
            style={{
              top: hole.top,
              left: 0,
              width: hole.left,
              height: hole.height,
            }}
            onClick={onClose}
            aria-hidden
          />
          <div
            className={dimClass}
            style={{
              top: hole.top,
              left: hole.left + hole.width,
              right: 0,
              height: hole.height,
            }}
            onClick={onClose}
            aria-hidden
          />
          {/* Highlight ring around the spotlight. */}
          <div
            className="pointer-events-none absolute rounded-xl transition-all duration-200 ease-out"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              boxShadow:
                "0 0 0 2px var(--primary), 0 0 0 6px color-mix(in oklch, var(--primary) 25%, transparent)",
            }}
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      )}

      {/* Step card. */}
      <div
        ref={cardRef}
        className="bg-popover text-popover-foreground border-border absolute w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border p-4 shadow-xl transition-[top,left,opacity] duration-200 ease-out"
        style={{
          top: cardPos?.top ?? VIEWPORT_MARGIN,
          left: cardPos?.left ?? VIEWPORT_MARGIN,
          opacity: cardPos ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour"
          className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-md transition-colors"
        >
          <X className="size-4" />
        </button>

        <p className="text-primary text-xs font-medium">
          Step {index + 1} of {total}
        </p>
        <h3 className="font-heading mt-1 pr-5 text-base font-semibold">
          {step.title}
        </h3>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          {step.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  i === index ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <Button variant="ghost" size="sm" onClick={goPrev}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Skip
              </Button>
            )}
            <Button size="sm" onClick={goNext}>
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
