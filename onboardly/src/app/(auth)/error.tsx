"use client";

// Error boundary for authenticated routes. Catches server/client render errors
// (e.g. a failed data fetch) and offers a retry instead of a blank crash page.

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[auth segment error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-2xl">
        <AlertTriangle className="text-destructive size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm">
          We couldn&apos;t load this page. This is usually temporary — try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
