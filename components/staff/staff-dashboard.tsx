"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import {
  Calendar,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  Megaphone,
  Plus,
  DollarSign,
  Headphones,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  Cloud,
  ArrowRight,
} from "lucide-react";
import { useSyncRefresh } from "@/hooks/use-platform-sync";

type StaffData = {
  employee?: {
    fullName: string;
    jobTitle: string;
    orgRole: string;
    department?: { name: string } | null;
  } | null;
  tasks: { id: string; title: string; status: string; project: { name: string } }[];
  leave: {
    id: string;
    leaveType: string;
    status: string;
    startDate: string;
    endDate: string;
  }[];
  notifications: { id: string; title: string; body: string; createdAt?: string; readAt?: string | null }[];
  leaveBalances?: { leaveType: string; available: number }[];
  attendanceRate?: number;
  attendanceTrend?: { day: number; rate: number }[];
  projectCount?: number;
  pendingTaskCount?: number;
  unreadNotifications?: number;
  ops?: {
    todayRevenueCents: number;
    openTickets: number;
    liveChats: number;
    newLeads: number;
    expiryAlerts: number;
    serverHealth: string;
  };
};

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s.includes("PROGRESS")) return "stitch-chip stitch-badge-progress";
  if (s.includes("REVIEW")) return "stitch-chip stitch-badge-review";
  if (s.includes("PEND") || s.includes("OPEN")) return "stitch-chip stitch-badge-pending";
  if (s.includes("DONE") || s.includes("COMPLETE")) return "stitch-chip stitch-badge-done";
  return "stitch-chip";
}

function leaveBalanceFromData(data: StaffData | null) {
  if (data?.leaveBalances?.length) {
    return data.leaveBalances.slice(0, 4).map((b) => ({
      label: b.leaveType.replace(/_/g, " "),
      days: b.available,
    }));
  }
  return [];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function StaffDashboard() {
  const [data, setData] = useState<StaffData | null>(null);
  const [progressPreview, setProgressPreview] = useState<
    Array<{ id: string; name: string; progressPct: number; currentMilestone: string | null }>
  >([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else setData(d);
  }, []);

  useSyncRefresh(["all"], load);

  useEffect(() => {
    load();
    fetch("/api/staff/projects/progress")
      .then(async (r) => {
        const d = await r.json();
        if (d.success) {
          setProgressPreview(
            (d.data ?? []).slice(0, 4).map(
              (p: {
                id: string;
                name: string;
                progressPct: number;
                currentMilestone: string | null;
              }) => ({
                id: p.id,
                name: p.name,
                progressPct: p.progressPct,
                currentMilestone: p.currentMilestone,
              })
            )
          );
        }
      })
      .catch(() => {});
  }, [load]);

  const firstName = data?.employee?.fullName?.split(" ")[0] || "Staff";
  const leaveBalances = leaveBalanceFromData(data);
  const totalLeaves = leaveBalances.reduce((s, b) => s + b.days, 0);
  const attendance = data?.attendanceRate ?? 0;
  const projects = data?.projectCount ?? 0;
  const tasks = data?.pendingTaskCount ?? data?.tasks?.length ?? 0;
  const unread = data?.unreadNotifications ?? 0;
  const trend = data?.attendanceTrend?.length ? data.attendanceTrend : [];
  const monthLabel = `${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`;
  const ops = data?.ops;

  return (
    <div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Dashboard</h1>
          <p className="stitch-page-sub">Welcome back, {firstName}!</p>
        </div>
        <div className="stitch-toolbar-actions">
          <Link href="/staff/command-center" className="stitch-btn-sm">
            Command Center
          </Link>
          <Link href="/staff/calendar" className="stitch-btn-primary-sm">
            <Calendar className="h-3.5 w-3.5" />
            Calendar
          </Link>
        </div>
      </div>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

      {ops ? (
        <>
          <h2 className="text-sm font-semibold mb-3 mt-2" style={{ color: "var(--sp-muted)" }}>
            Business operations
          </h2>
          <div className="stitch-stat-grid mb-8">
            <Link href="/staff/billing" className="stitch-stat-card stitch-stat-card-luminous">
              <DollarSign className="h-5 w-5 stitch-stat-icon" />
              <div className="stitch-stat-num">{formatMoney(ops.todayRevenueCents)}</div>
              <div className="stitch-stat-label">Revenue today</div>
            </Link>
            <Link href="/staff/tickets" className="stitch-stat-card stitch-stat-card-luminous">
              <Headphones className="h-5 w-5 stitch-stat-icon" />
              <div className="stitch-stat-num">{ops.openTickets}</div>
              <div className="stitch-stat-label">Open tickets</div>
            </Link>
            <Link href="/staff/live-chat" className="stitch-stat-card stitch-stat-card-luminous">
              <MessageSquare className="h-5 w-5 stitch-stat-icon" />
              <div className="stitch-stat-num">{ops.liveChats}</div>
              <div className="stitch-stat-label">Live chats</div>
            </Link>
            <Link href="/admin/crm" className="stitch-stat-card stitch-stat-card-luminous">
              <UserPlus className="h-5 w-5 stitch-stat-icon" />
              <div className="stitch-stat-num">{ops.newLeads}</div>
              <div className="stitch-stat-label">New leads today</div>
            </Link>
            <Link
              href="/staff/monitoring"
              className={`stitch-stat-card stitch-stat-card-luminous ${ops.expiryAlerts ? "!border-amber-500/40" : ""}`}
            >
              <AlertTriangle className="h-5 w-5 stitch-stat-icon" />
              <div className="stitch-stat-num">{ops.expiryAlerts}</div>
              <div className="stitch-stat-label">Expiry alerts</div>
            </Link>
            <Link href="/staff/cloud" className="stitch-stat-card stitch-stat-card-luminous">
              <Cloud className="h-5 w-5 stitch-stat-icon" />
              <div className="stitch-stat-num capitalize">{ops.serverHealth}</div>
              <div className="stitch-stat-label">Platform health</div>
            </Link>
          </div>
        </>
      ) : null}

      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--sp-muted)" }}>
        My workspace
      </h2>
      <div className="stitch-kpi-grid">
        <Link href="/staff/leave" className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-blue">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{totalLeaves}</div>
          <div className="stitch-kpi-label">Available Leaves</div>
        </Link>
        <Link href="/staff/attendance" className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-green">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{attendance}%</div>
          <div className="stitch-kpi-label">This Month</div>
          <div className="stitch-kpi-meta">Attendance</div>
        </Link>
        <Link href="/staff/projects" className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-orange">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{projects}</div>
          <div className="stitch-kpi-label">Active Projects</div>
        </Link>
        <Link href="/staff/tasks" className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-indigo">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{tasks}</div>
          <div className="stitch-kpi-label">Pending Tasks</div>
        </Link>
        <Link href="/staff/notifications" className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-purple">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{unread}</div>
          <div className="stitch-kpi-label">Unread</div>
        </Link>
      </div>

      <div className="stitch-dash-grid-2">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Announcements</h3>
            <Link href="/staff/notifications" className="stitch-btn-sm">
              View All
            </Link>
          </div>
          <div className="stitch-section-body">
            {!data ? (
              <p className="stitch-page-sub">Loading…</p>
            ) : data.notifications.length === 0 ? (
              <p className="stitch-page-sub">No announcements yet.</p>
            ) : (
              data.notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="stitch-announcement-item">
                  <h4>
                    {n.title}
                    {!n.readAt ? <span className="stitch-badge-new">New</span> : null}
                  </h4>
                  <p>{n.body}</p>
                  {n.createdAt ? (
                    <div className="stitch-announcement-date">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Monthly Attendance Overview</h3>
            <span className="text-xs border border-[var(--sp-outline)] rounded-md px-2 py-1 text-[var(--sp-muted)]">
              {monthLabel}
            </span>
          </div>
          <div className="stitch-section-body">
            {trend.length > 0 ? (
              <div className="stitch-chart-placeholder">
                {trend.map((bar, i) => (
                  <div
                    key={i}
                    className="stitch-chart-bar"
                    style={{ height: `${Math.max(bar.rate, 4)}%` }}
                    title={`Day ${bar.day}: ${bar.rate}%`}
                  />
                ))}
              </div>
            ) : (
              <p className="stitch-page-sub">No attendance records this period.</p>
            )}
            <p className="text-xs text-[var(--sp-muted)] mt-2 text-center">
              Month attendance: {attendance}%
            </p>
          </div>
        </section>
      </div>

      <div className="stitch-dash-grid-2">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>My Leave Balance</h3>
            <Link href="/staff/leave" className="stitch-btn-primary-sm">
              <Plus className="h-3.5 w-3.5" />
              Apply Leave
            </Link>
          </div>
          <div className="stitch-section-body">
            {leaveBalances.length === 0 ? (
              <p className="stitch-page-sub">Leave balances will appear after HR setup.</p>
            ) : (
              <div className="stitch-leave-grid">
                {leaveBalances.map((b) => (
                  <div key={b.label} className="stitch-leave-mini">
                    <strong>{b.days}</strong>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>My Recent Tasks</h3>
            <Link href="/staff/tasks" className="stitch-btn-sm">
              View All
            </Link>
          </div>
          <div className="stitch-section-body">
            {!data ? (
              <p className="stitch-page-sub">Loading tasks…</p>
            ) : data.tasks.length === 0 ? (
              <p className="stitch-page-sub">No pending tasks assigned.</p>
            ) : (
              data.tasks.slice(0, 4).map((t) => (
                <div key={t.id} className="stitch-row">
                  <span>
                    <strong>{t.title}</strong>
                    <span className="block text-xs mt-0.5" style={{ color: "var(--sp-muted)" }}>
                      {t.project.name}
                    </span>
                  </span>
                  <span className={statusBadgeClass(t.status)}>{t.status}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="stitch-section-card mt-6">
        <div className="stitch-section-head">
          <h3>Project progress</h3>
          <Link href="/staff/projects/progress" className="stitch-btn-sm">
            View all
          </Link>
        </div>
        <div className="stitch-section-body">
          {progressPreview.length === 0 ? (
            <p className="stitch-page-sub">No active projects to show.</p>
          ) : (
            progressPreview.map((p) => (
              <Link
                key={p.id}
                href={`/staff/projects/${p.id}`}
                className="stitch-row block hover:bg-[var(--sp-surface-2)] rounded-lg px-2 -mx-2"
              >
                <span>
                  <strong>{p.name}</strong>
                  {p.currentMilestone ? (
                    <span className="block text-xs mt-0.5" style={{ color: "var(--sp-muted)" }}>
                      {p.currentMilestone}
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold text-violet-400">{p.progressPct}%</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="stitch-section-card mt-6">
        <div className="stitch-section-head">
          <h3>Quick links</h3>
        </div>
        <div className="stitch-section-body flex flex-wrap gap-2">
          {[
            { href: "/staff/live-chat", label: "Live chat" },
            { href: "/staff/billing", label: "Billing" },
            { href: "/staff/clients", label: "Clients" },
            { href: "/staff/resources-hub", label: "Domain & Hosting Hub" },
            { href: "/staff/projects/progress", label: "Project progress" },
            { href: "/staff/cloud", label: "AWS Cloud" },
            { href: "/staff/command-center", label: "Command center" },
          ].map((q) => (
            <Link key={q.href} href={q.href} className="stitch-btn-sm inline-flex items-center gap-1">
              {q.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
