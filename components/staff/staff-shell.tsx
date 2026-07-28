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
  Bell,
  Mail,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Hexagon,
  MessageSquare,
  GraduationCap,
  Shield,
  KeyRound,
  Activity,
  Cloud,
  Globe2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StaffSearchProvider, StaffSearchTrigger } from "@/components/staff/staff-global-search";
import { AgentPresenceToggle } from "@/components/staff/agent-presence-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  superAdminOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  superAdminOnly?: boolean;
};

const navGroups: NavGroup[] = [
  {
    id: "main",
    label: "",
    items: [{ href: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    id: "work",
    label: "My Work",
    items: [
      { href: "/staff/profile", label: "Profile", icon: User },
      { href: "/staff/attendance", label: "Attendance", icon: Clock },
      { href: "/staff/leave", label: "Leave", icon: Plane },
      { href: "/staff/payslip", label: "Payslip", icon: Receipt },
      { href: "/staff/performance", label: "Performance", icon: BarChart3 },
      { href: "/staff/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/staff/training", label: "Training", icon: GraduationCap },
      { href: "/staff/tasks", label: "Tasks", icon: CheckSquare },
    ],
  },
  {
    id: "clients",
    label: "Clients & Projects",
    items: [
      { href: "/staff/clients", label: "Clients", icon: Users },
      { href: "/staff/projects", label: "Projects", icon: FolderKanban },
      { href: "/staff/projects/progress", label: "Progress tracker", icon: BarChart3 },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    items: [
      { href: "/staff/billing", label: "Invoices", icon: CreditCard },
      { href: "/staff/receipts", label: "Receipts", icon: Receipt },
      { href: "/staff/quotations", label: "Quotations", icon: FileSignature },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      { href: "/staff/domains", label: "Domains", icon: Globe2 },
      { href: "/staff/hosting", label: "Hosting", icon: Server },
      { href: "/staff/resources-hub", label: "Domain & Hosting Hub", icon: Globe2 },
      { href: "/staff/cloud", label: "AWS Cloud", icon: Cloud },
      { href: "/staff/monitoring", label: "Monitoring", icon: Server },
      { href: "/admin/erp/documents", label: "Documents", icon: FolderOpen },
      { href: "/admin/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    items: [
      { href: "/staff/announcements", label: "Announcements", icon: Megaphone },
      { href: "/staff/notifications", label: "Notifications", icon: Bell },
      { href: "/staff/tickets", label: "Helpdesk", icon: Headphones },
      { href: "/staff/chat", label: "Internal Chat", icon: Mail },
      { href: "/staff/live-chat", label: "Live Chat", icon: MessageSquare },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [{ href: "/staff/command-center", label: "Command Center", icon: Activity }],
  },
  {
    id: "settings",
    label: "Settings",
    superAdminOnly: true,
    items: [
      { href: "/staff/roles", label: "Roles", icon: KeyRound, superAdminOnly: true },
      { href: "/staff/security", label: "Security", icon: Shield, superAdminOnly: true },
      { href: "/admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
    ],
  },
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

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffShell({
  children,
  userName,
  userRole,
  isSuperAdmin = false,
}: {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const roleLabel =
    userRole === "OWNER"
      ? "Owner"
      : userRole === "ADMIN"
        ? "Sub Admin"
        : userRole || "Team Member";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const visibleGroups = navGroups.filter((g) => isSuperAdmin || !g.superAdminOnly);

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

  function toggleGroup(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <StaffSearchProvider>
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
            {visibleGroups.map((group) => {
              const items = group.items.filter((item) => isSuperAdmin || !item.superAdminOnly);
              if (!items.length) return null;
              const isCollapsed = collapsed[group.id] ?? false;
              const groupActive = items.some((item) => isActive(pathname, item.href, item.exact));

              return (
                <div key={group.id} className="stitch-nav-group">
                  {group.label ? (
                    <button
                      type="button"
                      className={cn("stitch-nav-group-label", groupActive && "is-active")}
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={!isCollapsed}
                    >
                      <span>{group.label}</span>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          !isCollapsed && "rotate-90"
                        )}
                      />
                    </button>
                  ) : null}
                  {!isCollapsed || !group.label ? (
                    <div className="stitch-nav-group-items">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(pathname, item.href, item.exact);
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
                    </div>
                  ) : null}
                </div>
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
              <div className="hidden sm:block min-w-0 flex-1 max-w-md">
                <StaffSearchTrigger />
              </div>
            </div>
            <div className="stitch-topbar-actions">
              <AgentPresenceToggle />
              <Link href="/staff/notifications" className="stitch-topbar-icon-btn" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Link>
              <Link href="/staff/chat" className="stitch-topbar-icon-btn" aria-label="Messages">
                <Mail className="h-4 w-4" />
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
            <span>Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk</span>
            <span>© 2026 MernCrest Solutions (PVT) Ltd.</span>
          </footer>
        </div>
      </div>
    </StaffSearchProvider>
  );
}
