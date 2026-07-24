"use client";

import { useEffect, useState } from "react";
import "@/app/styles/stitch-portal.css";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import {
  LayoutDashboard,
  User,
  Clock,
  Plane,
  Receipt,
  BarChart3,
  FolderKanban,
  CheckSquare,
  CreditCard,
  Users,
  Server,
  Megaphone,
  FileText,
  FileSignature,
  FolderOpen,
  Headphones,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Mail,
  CalendarDays,
  ChevronDown,
  Hexagon,
  MessageSquare,
  GraduationCap,
  Shield,
  KeyRound,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandSearchProvider } from "@/components/layout/command-search";
import { AgentPresenceToggle } from "@/components/staff/agent-presence-toggle";

const mainNav = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/staff/profile", label: "Profile", icon: User },
  { href: "/staff/attendance", label: "Attendance", icon: Clock },
  { href: "/staff/leave", label: "Leave Management", icon: Plane },
  { href: "/staff/payslip", label: "Payslip", icon: Receipt },
  { href: "/staff/performance", label: "Performance", icon: BarChart3 },
  { href: "/staff/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/staff/training", label: "Training", icon: GraduationCap },
  { href: "/staff/projects", label: "Project Management", icon: FolderKanban },
  { href: "/staff/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/staff/billing", label: "Billing & Invoices", icon: CreditCard },
  { href: "/staff/receipts", label: "Receipts", icon: Receipt },
  { href: "/staff/quotations", label: "Quotations", icon: FileSignature },
  { href: "/staff/clients", label: "Clients", icon: Users },
  { href: "/admin/domains", label: "Services", icon: Server },
  { href: "/staff/notifications", label: "Announcements", icon: Megaphone },
  { href: "/admin/erp/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/staff/tickets", label: "Helpdesk", icon: Headphones },
  { href: "/staff/chat", label: "Internal Chat", icon: Mail },
  { href: "/staff/live-chat", label: "Live Chat", icon: MessageSquare },
  { href: "/staff/command-center", label: "Command Center", icon: Activity },
  { href: "/staff/roles", label: "Roles", icon: KeyRound },
  { href: "/staff/security", label: "Security", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function initials(name?: string) {
  if (!name) return "MC";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StaffShell({
  children,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const firstName = userName?.split(" ")[0] || "Staff";
  const roleLabel = userRole || "Staff Member";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login?system=1");
    router.refresh();
  }

  return (
    <CommandSearchProvider>
      <div className="stitch-app stitch-system stitch-shell">
        <div
          className={cn("stitch-sidebar-overlay", sidebarOpen && "is-open")}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />

        <aside className={cn("stitch-sidebar", sidebarOpen && "is-open")}>
          <Link href="/staff" className="stitch-sidebar-brand">
            <span className="stitch-brand-icon">
              <Hexagon className="h-5 w-5" />
            </span>
            <span className="stitch-brand-text">
              MernCrest SOLUTIONS
              <span>Staff Portal</span>
            </span>
          </Link>

          <nav className="stitch-nav">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(active && "active")}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            <button type="button" className="stitch-logout" onClick={logout}>
              <LogOut className="h-4 w-4 shrink-0 inline mr-2" />
              Logout
            </button>
          </nav>

          <div className="stitch-sidebar-profile">
            <div className="stitch-sidebar-profile-avatar">{initials(userName)}</div>
            <div className="stitch-sidebar-profile-info">
              <strong>{userName || "Staff User"}</strong>
              <span>{roleLabel}</span>
              <div className="stitch-sidebar-profile-status">Online</div>
            </div>
          </div>
        </aside>

        <div className="stitch-main">
          <header className="stitch-topbar">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="stitch-menu-toggle"
                onClick={() => setSidebarOpen((o) => !o)}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="stitch-search-wrap hidden sm:block">
                <Search className="stitch-search-icon" />
                <input type="search" placeholder="Search anything..." aria-label="Search" />
                <span className="stitch-search-kbd">/</span>
              </div>
            </div>
            <div className="stitch-topbar-actions">
              <AgentPresenceToggle />
              <Link href="/staff/notifications" className="stitch-topbar-icon-btn" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="stitch-topbar-badge">3</span>
              </Link>
              <Link href="/staff/chat" className="stitch-topbar-icon-btn" aria-label="Messages">
                <Mail className="h-4 w-4" />
                <span className="stitch-topbar-badge">1</span>
              </Link>
              <Link href="/staff/calendar" className="stitch-topbar-icon-btn" aria-label="Calendar">
                <CalendarDays className="h-4 w-4" />
              </Link>
              <div className="stitch-topbar-user">
                <div className="stitch-topbar-user-avatar">{initials(userName)}</div>
                <div className="stitch-topbar-user-info">
                  <strong>{userName || "Staff"}</strong>
                  <span>{roleLabel}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--sp-muted)] hidden sm:block" />
              </div>
            </div>
          </header>

          <main className="stitch-content">{children}</main>

          <footer className="stitch-portal-footer">
            <span>© 2026 MernCrest Solutions (PVT) Ltd. All Rights Reserved.</span>
            <span>Version 1.0.0</span>
          </footer>
        </div>
      </div>
    </CommandSearchProvider>
  );
}
