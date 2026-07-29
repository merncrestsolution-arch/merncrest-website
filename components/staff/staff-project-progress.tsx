"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { FolderKanban, ArrowRight, TrendingUp } from "lucide-react";
import { formatSriLankaDate, formatSriLankaDateTime } from "@/lib/timezone";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";

type ProgressRow = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  progressPct: number;
  progressOverridePct: number | null;
  currentMilestone: string | null;
  latestUpdate: {
    id: string;
    title: string;
    body: string;
    createdAt: string;
  } | null;
  upcomingDeadline: string | null;
  endDate: string | null;
  client: { id: string; name: string } | null;
  backlogCount: number;
  openTaskCount: number;
};

function progressTone(pct: number) {
  if (pct >= 80) return "from-emerald-500 to-teal-400";
  if (pct >= 50) return "from-violet-500 to-indigo-400";
  if (pct >= 25) return "from-amber-500 to-orange-400";
  return "from-slate-400 to-slate-500";
}

export function StaffProjectProgress() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/staff/projects/progress")
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setRows(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const avgProgress =
    rows.length > 0
      ? Math.round(rows.reduce((s, p) => s + p.progressPct, 0) / rows.length)
      : 0;

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Progress tracker</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-5">
        <h1 className="stitch-page-title">Project progress</h1>
        <p className="stitch-page-sub !mb-0">
          Active projects at a glance — milestone, progress, latest update, and deadlines.
        </p>
      </div>

      {!loading && rows.length > 0 ? (
        <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4 mb-6">
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-icon stitch-kpi-icon-purple">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="stitch-kpi-value">{rows.length}</div>
            <div className="stitch-kpi-label">Active projects</div>
          </div>
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-icon stitch-kpi-icon-blue">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="stitch-kpi-value text-violet-400">{avgProgress}%</div>
            <div className="stitch-kpi-label">Average progress</div>
          </div>
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-value">{rows.reduce((s, p) => s + p.openTaskCount, 0)}</div>
            <div className="stitch-kpi-label">Open tasks</div>
          </div>
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-value">{rows.reduce((s, p) => s + p.backlogCount, 0)}</div>
            <div className="stitch-kpi-label">Backlog items</div>
          </div>
        </div>
      ) : null}

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      {loading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No active projects"
          description="Projects in Planning, Active, or On Hold appear here."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((p) => (
            <article key={p.id} className="stitch-section-card stitch-progress-card">
              <div className="stitch-section-body">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <Link
                      href={`/staff/projects/${p.id}`}
                      className="font-semibold text-lg hover:text-violet-400 transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-[var(--sp-muted)] font-mono mt-0.5">
                      {p.projectCode}
                      {p.client ? ` · ${p.client.name}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-violet-400 tabular-nums transition-all">
                      {p.progressPct}%
                    </div>
                    {p.progressOverridePct != null ? (
                      <p className="text-[10px] text-[var(--sp-muted)]">manual override</p>
                    ) : null}
                  </div>
                </div>

                <div className="stitch-wave-progress mb-4">
                  <div
                    className={`stitch-wave-progress-fill bg-gradient-to-r ${progressTone(p.progressPct)}`}
                    style={{ width: `${p.progressPct}%` }}
                  />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-4">
                  <div className="rounded-lg bg-[var(--sp-surface-2)] p-3 transition-colors">
                    <span className="text-[var(--sp-muted)] text-xs">Current milestone</span>
                    <p className="font-medium mt-0.5">{p.currentMilestone || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--sp-surface-2)] p-3 transition-colors">
                    <span className="text-[var(--sp-muted)] text-xs">Upcoming deadline</span>
                    <p className="font-medium mt-0.5">
                      {p.upcomingDeadline
                        ? formatSriLankaDate(p.upcomingDeadline)
                        : p.endDate
                          ? formatSriLankaDate(p.endDate)
                          : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--sp-surface-2)] p-3 transition-colors">
                    <span className="text-[var(--sp-muted)] text-xs">Open tasks</span>
                    <p className="font-medium mt-0.5">{p.openTaskCount}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--sp-surface-2)] p-3 transition-colors">
                    <span className="text-[var(--sp-muted)] text-xs">Backlog items</span>
                    <p className="font-medium mt-0.5">{p.backlogCount}</p>
                  </div>
                </div>

                {p.latestUpdate ? (
                  <div className="rounded-lg border border-[var(--sp-outline)] bg-[var(--sp-surface-2)] p-3 text-sm transition-colors">
                    <p className="text-xs text-[var(--sp-muted)] mb-1">
                      Latest update · {formatSriLankaDateTime(p.latestUpdate.createdAt)}
                    </p>
                    <p className="font-medium">{p.latestUpdate.title}</p>
                    <p className="text-[var(--sp-muted)] line-clamp-2 mt-1">{p.latestUpdate.body}</p>
                  </div>
                ) : null}

                <Link
                  href={`/staff/projects/${p.id}`}
                  className="stitch-btn-outline-sm mt-4 inline-flex transition-all hover:gap-2"
                >
                  View project <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
