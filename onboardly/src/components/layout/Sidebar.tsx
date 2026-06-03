// Sidebar navigation for the authenticated app. Primary nav mirrors the
// new-hire onboarding overview (Overview / My Plan / Resources / AI Assistant /
// Settings); a Workspace section keeps the earlier Projects/Integrations
// surfaces reachable. Active item is highlighted from the current path.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ListChecks,
  BookOpen,
  Sparkles,
  Settings,
  FolderKanban,
  Puzzle,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/plan", label: "My Plan", icon: ListChecks },
  { href: "/dashboard/resources", label: "Resources", icon: BookOpen },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const workspaceNav: NavItem[] = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/integrations", label: "Integrations", icon: Puzzle },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function deriveName(email: string | null): string {
  if (!email) return "New Hire";
  const handle = email.split("@")[0];
  return handle
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface SidebarProps {
  email: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
}

export function Sidebar({ email, avatarUrl, displayName }: SidebarProps) {
  const pathname = usePathname();
  const name = displayName || deriveName(email);
  const initial = (displayName || email)?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 flex-col overflow-y-auto border-r p-4 md:flex">
      <nav className="flex flex-col gap-1">
        {primaryNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </nav>

      <p className="text-sidebar-foreground/50 mt-6 mb-1 px-3 text-xs font-medium tracking-wide uppercase">
        Workspace
      </p>
      <nav className="flex flex-col gap-1">
        {workspaceNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </nav>

      {/* User chip pinned to the bottom of the sidebar. */}
      <div className="border-sidebar-border mt-auto flex items-center gap-3 border-t pt-4">
        <Avatar className="size-9 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-sidebar-foreground/60 truncate text-xs">
            New Hire
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Sign out"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
