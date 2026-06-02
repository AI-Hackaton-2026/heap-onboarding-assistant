// Shared authenticated app layout shell: header + sidebar + main content area.

import type { ReactNode } from "react";
import { AuthHeader } from "./AuthHeader";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
