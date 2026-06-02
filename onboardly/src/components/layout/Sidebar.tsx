// Sidebar navigation for the authenticated app.

import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/integrations", label: "Integrations" },
];

export function Sidebar() {
  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 border-r p-4 md:block">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-3 py-2 text-sm"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
