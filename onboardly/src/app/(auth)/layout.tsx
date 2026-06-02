// Layout for all authenticated routes — wraps pages in the app shell
// (header + sidebar). Auth protection (redirect to login) gets added in Phase 1.

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
