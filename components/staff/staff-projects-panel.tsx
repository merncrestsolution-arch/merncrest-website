"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  PauseCircle,
  Plus,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";

type ProjectRow = {
  id: string;
  name: string;
  code?: string | null;
  status: string;
  priority?: string | null;
  progressPct?: number | null;
  dueDate?: string | null;
  clientName?: string | null;
  manager?: { fullName: string } | null;
  revenueCents?: number;
  nextPaymentCents?: number;
  balanceCents?: number;
};

type StatusTab = "ALL" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s.includes("COMPLETE") || s === "DONE") return "stitch-chip stitch-badge-done";
  if (s.includes("HOLD")) return "stitch-chip stitch-badge-pending";
  if (s.includes("CANCEL")) return "stitch-chip";
  if (s.includes("REVIEW")) return "stitch-chip stitch-badge-review";
  return "stitch-chip stitch-badge-progress";
}

function priorityBadge(priority?: string | null) {
  const p = (priority || "MEDIUM").toUpperCase();
  if (p === "HIGH") return "stitch-chip stitch-badge-danger";
  if (p === "LOW") return "stitch-chip stitch-badge-done";
  return "stitch-chip stitch-badge-pending";
}

export function StaffProjectsPanel() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/erp/projects")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        const list = (d.projects ?? []).map(
          (p: {
            id: string;
            name: string;
            projectCode: string;
            status: string;
            progressPct?: number;
            endDate?: string | null;
            revenueCents?: number;
            nextPaymentCents?: number;
            finance?: { revenueCents?: number; nextPaymentCents?: number; overdueCents?: number };
            customer?: { fullName: string; company?: string | null } | null;
            members?: { user: { fullName: string }; role: string }[];
            tasks?: { priority?: string }[];
          }) => ({
            id: p.id,
            name: p.name,
            code: p.projectCode,
            status: p.status,
            priority: p.tasks?.find((t) => t.priority)?.priority ?? "MEDIUM",
            progressPct: p.progressPct ?? 0,
            dueDate: p.endDate,
            clientName: p.customer?.company || p.customer?.fullName || null,
            revenueCents: p.finance?.revenueCents ?? p.revenueCents ?? 0,
            nextPaymentCents: p.finance?.nextPaymentCents ?? p.nextPaymentCents ?? 0,
            balanceCents: p.finance?.overdueCents ?? 0,
            manager: (() => {
              const lead = p.members?.find((m) => m.role === "LEAD") ?? p.members?.[0];
              return lead?.user ? { fullName: lead.user.fullName } : null;
            })(),
          })
        );
        setProjects(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const s = p.status.toUpperCase();
      if (statusTab === "IN_PROGRESS" && !["IN_PROGRESS", "ACTIVE", "OPEN", "PLANNING"].some((x) => s.includes(x))) return false;
      if (statusTab === "COMPLETED" && !s.includes("COMPLETE") && s !== "DONE") return false;
      if (statusTab === "ON_HOLD" && !s.includes("HOLD")) return false;
      if (statusTab === "CANCELLED" && !s.includes("CANCEL")) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.clientName?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [projects, statusTab, search]);

  const stats = useMemo(() => {
    const inProgress = projects.filter((p) =>
    ["IN_PROGRESS", "ACTIVE", "OPEN", "PLANNING"].some((x) => p.status.toUpperCase().includes(x))
  );
    const completed = projects.filter((p) => p.status.toUpperCase().includes("COMPLETE") || p.status.toUpperCase() === "DONE");
    const onHold = projects.filter((p) => p.status.toUpperCase().includes("HOLD"));
    const cancelled = projects.filter((p) => p.status.toUpperCase().includes("CANCEL"));
    const contractValue = projects.reduce((s, p) => s + (p.revenueCents ?? 0), 0);
    const pendingPayments = projects.reduce((s, p) => s + (p.nextPaymentCents ?? 0), 0);
    return {
      total: projects.length,
      inProgress: inProgress.length,
      completed: completed.length,
      onHold: onHold.length,
      cancelled: cancelled.length,
      contractValue,
      pendingPayments,
    };
  }, [projects]);

  const byPriority = useMemo(() => {
    const high = projects.filter((p) => (p.priority || "").toUpperCase() === "HIGH").length;
    const medium = projects.filter((p) => (p.priority || "MEDIUM").toUpperCase() === "MEDIUM").length;
    const low = projects.filter((p) => (p.priority || "").toUpperCase() === "LOW").length;
    return { high, medium, low, max: Math.max(high, medium, low, 1) };
  }, [projects]);

  const upcoming = useMemo(() => {
    return [...projects]
      .filter((p) => p.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 4);
  }, [projects]);

  return (
    <div>
      <div className="stitch-breadcrumb">
        <Link href="/staff">Dashboard</Link> &gt; Project Management
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title">Project Management</h1>
          <p className="stitch-page-sub !mb-0">Track projects, deadlines, and team workload.</p>
        </div>
        <Link href="/admin/erp/projects" className="stitch-btn-primary-sm">
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-6 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-indigo">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Total Projects</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-blue">
            <Clock className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.inProgress}</div>
          <div className="stitch-kpi-label">In Progress</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-green">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.completed}</div>
          <div className="stitch-kpi-label">Completed</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-orange">
            <PauseCircle className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.onHold}</div>
          <div className="stitch-kpi-label">On Hold</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-purple">
            <XCircle className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value text-lg">{formatMoney(stats.contractValue)}</div>
          <div className="stitch-kpi-label">Contract Value</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-orange">
            <Clock className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value text-lg">{formatMoney(stats.pendingPayments)}</div>
          <div className="stitch-kpi-label">Pending Payments</div>
        </div>
      </div>

      <div className="stitch-master-detail stitch-master-detail-widgets">
        <div className="stitch-master-detail-main">
          <div className="stitch-tab-row">
            {(
              [
                ["ALL", "All Projects"],
                ["IN_PROGRESS", "In Progress"],
                ["COMPLETED", "Completed"],
                ["ON_HOLD", "On Hold"],
                ["CANCELLED", "Cancelled"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={statusTab === id ? "active" : ""}
                onClick={() => setStatusTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="stitch-toolbar">
            <div className="stitch-search-wrap !max-w-none flex-1">
              <Search className="stitch-search-icon" />
              <input
                type="search"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="stitch-btn-outline-sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          </div>

          <section className="stitch-section-card">
            <div className="stitch-section-body overflow-x-auto !p-0">
              <table className="stitch-table stitch-table-clickable">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Contract</th>
                    <th>Next payment</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/staff/projects/${p.id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="stitch-avatar-sm !rounded-md">
                            {(p.code || p.name).slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <span className="font-medium block">{p.name}</span>
                            {p.code ? (
                              <span className="text-xs text-[var(--sp-muted)] font-mono">{p.code}</span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>{p.clientName || "—"}</td>
                      <td className="font-medium whitespace-nowrap">
                        {(p.revenueCents ?? 0) > 0 ? formatMoney(p.revenueCents!) : "—"}
                      </td>
                      <td className="whitespace-nowrap">
                        {(p.nextPaymentCents ?? 0) > 0 ? (
                          <span className="text-amber-600 font-medium">{formatMoney(p.nextPaymentCents!)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className={statusBadge(p.status)}>{p.status}</span>
                      </td>
                      <td>
                        <div className="stitch-progress-cell">
                          <div className="stitch-progress-bar">
                            <div style={{ width: `${p.progressPct ?? 0}%` }} />
                          </div>
                          <span>{p.progressPct ?? 0}%</span>
                        </div>
                      </td>
                      <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="stitch-pagination">
                Showing 1 to {filtered.length} of {projects.length} projects
              </div>
            </div>
          </section>
        </div>

        <aside className="stitch-widgets-col">
          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>Project Overview</h3>
            </div>
            <div className="stitch-section-body">
              <div className="stitch-donut-legend">
                <div><span className="dot blue" /> In Progress {stats.inProgress}</div>
                <div><span className="dot green" /> Completed {stats.completed}</div>
                <div><span className="dot orange" /> On Hold {stats.onHold}</div>
                <div><span className="dot gray" /> Cancelled {stats.cancelled}</div>
              </div>
            </div>
          </section>

          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>Projects by Priority</h3>
            </div>
            <div className="stitch-section-body space-y-3">
              {(["High", "Medium", "Low"] as const).map((label, i) => {
                const count = [byPriority.high, byPriority.medium, byPriority.low][i];
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{label}</span>
                      <span>{count}</span>
                    </div>
                    <div className="stitch-h-bar">
                      <div style={{ width: `${(count / byPriority.max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>Upcoming Deadlines</h3>
            </div>
            <div className="stitch-section-body space-y-3">
              {upcoming.length ? (
                upcoming.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="stitch-deadline-item w-full text-left"
                    onClick={() => router.push(`/staff/projects/${p.id}`)}
                  >
                    <div className="stitch-deadline-date">
                      {p.dueDate
                        ? new Date(p.dueDate).toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase()
                        : "—"}
                    </div>
                    <div>
                      <strong className="text-sm block">{p.name}</strong>
                      <span className={priorityBadge(p.priority)}>{p.priority || "Medium"}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-[var(--sp-muted)]">No upcoming deadlines.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
