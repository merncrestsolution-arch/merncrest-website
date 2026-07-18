"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { LayoutDashboard, CheckSquare, MessageSquare, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/staff/chat", label: "Internal chat", icon: MessageSquare },
  { href: "/admin/erp", label: "ERP modules", icon: Building2 },
] as const;

export function StaffShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-[#061018] text-foreground">
      <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="font-display font-bold gradient-text">MernCrest</Link>
          <p className="text-xs text-muted mt-1">Staff Portal</p>
          {userName && <p className="text-xs mt-2 truncate">{userName}</p>}
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {links.map((l) => {
            const Icon = l.icon;
            const active = l.href === "/staff" ? pathname === "/staff" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={logout} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
