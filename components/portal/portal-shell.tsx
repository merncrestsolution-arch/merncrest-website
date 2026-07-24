"use client";

import { useEffect } from "react";
import "@/app/styles/stitch-portal.css";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { CommandSearchProvider } from "@/components/layout/command-search";
import type { SessionUser } from "@/lib/auth-types";
import {
  LayoutDashboard,
  Server,
  Globe,
  Cloud,
  FolderKanban,
  CreditCard,
  Headphones,
  Settings,
  ShoppingCart,
  Bell,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/portal/services", label: "Services", icon: Server },
  { href: "/portal/domains", label: "Domains", icon: Globe },
  { href: "/portal/hosting", label: "Hosting", icon: Cloud },
  { href: "/portal/projects", label: "Projects", icon: FolderKanban },
  { href: "/portal/invoices", label: "Billing", icon: CreditCard },
  { href: "/portal/tickets", label: "Support", icon: Headphones },
  { href: "/portal/downloads", label: "Downloads", icon: Download },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

export function PortalShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const firstName = user.fullName?.split(" ")[0] || "Customer";

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <CommandSearchProvider>
      <div className="stitch-app stitch-shell">
        <aside className="stitch-sidebar">
          <Link href="/portal" className="stitch-sidebar-brand">
            <span>Portal</span>.merncrest
          </Link>
          <nav className="stitch-nav">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={cn(active && "active")}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button type="button" className="stitch-logout" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <div className="stitch-main">
          <header className="stitch-topbar">
            <h1>Hello, {firstName}</h1>
            <div className="stitch-topbar-actions">
              <Link href="/portal/notifications" className="text-violet-600 flex items-center gap-1">
                <Bell className="h-4 w-4" /> Alerts
              </Link>
              <Link href="/portal/cart" className="text-violet-600 flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" /> Cart
              </Link>
              <span className="text-[#999] hidden sm:inline">{user.email}</span>
            </div>
          </header>
          <main className="stitch-content">{children}</main>
        </div>
      </div>
    </CommandSearchProvider>
  );
}
