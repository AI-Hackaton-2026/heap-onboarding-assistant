"use client";

// Phone navigation drawer for the authenticated shell.

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppIcon } from "@/components/layout/AppIcon";

interface MobileNavProps {
  email: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

export function MobileNav({ email, avatarUrl, displayName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="font-heading border-sidebar-border absolute inset-x-0 top-0 flex h-16 items-center gap-2 border-b px-4 text-base font-semibold"
        >
          <AppIcon className="size-7" />
          Onboardly
        </Link>
        <Sidebar
          email={email}
          avatarUrl={avatarUrl}
          displayName={displayName}
          className="flex h-full w-full border-0 pt-16 md:hidden"
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
