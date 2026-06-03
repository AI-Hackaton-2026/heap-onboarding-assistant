// Shared auth card for the login + register pages: the Onboardly app icon in a
// brand tile, a headline, and supporting copy above a bordered card, with an
// optional footer line below (used for cross-links and the Terms agreement).
// Keeps both auth pages visually identical so only the form inside differs.

import type { ReactNode } from "react";
import { AppIcon } from "@/components/layout/AppIcon";
import { Card, CardContent } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  /** Optional inline error shown above the form (e.g. from a query param). */
  error?: ReactNode;
  /** The form / body of the card. */
  children: ReactNode;
  /** Small print below the card — cross-links, terms agreement. */
  footer?: ReactNode;
}

export function AuthCard({
  title,
  description,
  error,
  children,
  footer,
}: AuthCardProps) {
  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="bg-card ring-primary/15 inline-flex size-14 items-center justify-center rounded-2xl shadow-sm ring-1">
          <AppIcon className="size-9" />
        </span>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <Card className="ring-foreground/5 shadow-xl">
        <CardContent className="p-2 sm:p-3">
          {error ? (
            <p
              className="text-destructive bg-destructive/10 mb-4 rounded-lg px-3 py-2 text-sm"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {children}
        </CardContent>
      </Card>

      {footer ? (
        <div className="text-muted-foreground mt-6 text-center text-xs">
          {footer}
        </div>
      ) : null}
    </>
  );
}
