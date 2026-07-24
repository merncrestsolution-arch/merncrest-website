"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import {
  Calendar,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  Megaphone,
  Plus,
} from "lucide-react";

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
  notifications: { id: string; title: string; body: string; createdAt?: string }[];
  leaveBalances?: { leaveType: string; available: number }[];
  attendanceRate?: number;
  projectCount?: number;
};

const DEMO_ANNOUNCEMENTS = [
  {
    id: "a1",
    title: "Office Holiday",
    body: "The office will be closed on 25 Dec 2025 for the Christmas holiday.",
    date: "25 Dec 2025",
    isNew: true,
  },
  {
    id: "a2",
    title: "System Maintenance",
    body: "Scheduled maintenance on System.merncrest.lk this Saturday 2:00–4:00 AM.",
    date: "20 Dec 2025",
    isNew: false,
  },
  {
    id: "a3",
    title: "New HR Policy",
    body: "Updated leave policy is now available in Documents. Please review by month end.",
    date: "15 Dec 2025",
    isNew: false,
  },
];

const ATTENDANCE_BARS = [88, 92, 95, 93, 97, 96, 94, 98, 95, 96, 97, 95, 94, 96, 98];

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s.includes("PROGRESS")) return "stitch-chip stitch-badge-progress";
  if (s.includes("REVIEW")) return "stitch-chip stitch-badge-review";
  if (s.includes("PEND") || s.includes("OPEN")) return "stitch-chip stitch-badge-pending";
  if (s.includes("DONE") || s.includes("COMPLETE")) return "stitch-chip stitch-badge-done";
  return "stitch-chip";
}

function leaveBalanceFromData(data: StaffData) {
  if (data.leaveBalances?.length) {
    return data.leaveBalances.slice(0, 4).map((b) => ({
      label: b.leaveType.replace(/_/g, " "),
      days: b.available,
    }));
  }
  return [
    { label: "Casual Leave", days: 6 },
    { label: "Sick Leave", days: 3 },
    { label: "Earned Leave", days: 12 },
    { label: "Unpaid Leave", days: 2 },
  ];
}

export function StaffDashboard() {
  const [data, setData] = useState<StaffData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else setData(d);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = data?.employee?.fullName?.split(" ")[0] || "Staff";
  const totalLeaves = leaveBalanceFromData(data ?? { tasks: [], leave: [], notifications: [] }).reduce(
    (s, b) => s + b.days,
    0
  );
  const attendance = data?.attendanceRate ?? 95.6;
  const projects = data?.projectCount ?? 5;
  const tasks = data?.tasks?.length ?? 18;
  const announcements = data?.notifications?.length ?? 3;
  const leaveBalances = leaveBalanceFromData(data ?? { tasks: [], leave: [], notifications: [] });

  return (
    <div>
      <h1 className="stitch-page-title">Dashboard</h1>
      <p className="stitch-page-sub">
        Welcome back, {firstName}! 👋
      </p>

      {error ? <p className="stitch-auth-error">{error}</p> : null}

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
          <div className="stitch-kpi-label">Ongoing Projects</div>
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
          <div className="stitch-kpi-value">{announcements}</div>
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
            {(data?.notifications?.length
              ? data.notifications.slice(0, 3).map((n) => ({
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  date: n.createdAt
                    ? new Date(n.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "",
                  isNew: false,
                }))
              : DEMO_ANNOUNCEMENTS
            ).map((a) => (
              <div key={a.id} className="stitch-announcement-item">
                <h4>
                  {a.title}
                  {a.isNew ? <span className="stitch-badge-new">New</span> : null}
                </h4>
                <p>{a.body}</p>
                {a.date ? <div className="stitch-announcement-date">{a.date}</div> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Monthly Attendance Overview</h3>
            <select className="text-xs border border-[var(--sp-outline)] rounded-md px-2 py-1 bg-white text-[var(--sp-muted)]">
              <option>June 2026</option>
              <option>May 2026</option>
            </select>
          </div>
          <div className="stitch-section-body">
            <div className="stitch-chart-placeholder">
              {ATTENDANCE_BARS.map((h, i) => (
                <div
                  key={i}
                  className="stitch-chart-bar"
                  style={{ height: `${h}%` }}
                  title={`Day ${i + 1}: ${h}%`}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--sp-muted)] mt-2 text-center">
              Showing stable {attendance}%+ attendance trend
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
            <div className="stitch-leave-grid">
              {leaveBalances.map((b) => (
                <div key={b.label} className="stitch-leave-mini">
                  <strong>{b.days}</strong>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
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
              <div className="stitch-row">
                <span>Staff Portal UI Design</span>
                <span className="stitch-chip stitch-badge-progress">In Progress</span>
              </div>
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
    </div>
  );
}
