"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { ProjectTeamPanel } from "@/components/staff/project-team-panel";
import { ProjectResourcesPanel } from "@/components/staff/project-resources-panel";
import { ProjectUpdatesPanel } from "@/components/staff/project-updates-panel";
import { ProjectTimelinePanel } from "@/components/staff/project-timeline-panel";
import { ProjectBacklogPanel } from "@/components/staff/project-backlog-panel";
import { ProjectDevNotesPanel } from "@/components/staff/project-dev-notes-panel";
import { ProjectServicesPanel } from "@/components/staff/project-services-panel";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  Mail,
  Phone,
  Users,
  Wallet,
} from "lucide-react";

type Milestone = {
  id: string;
  title: string;
  status: string;
  progressPct?: number;
  dueDate?: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  progressPct: number;
  dueDate?: string | null;
  parentId?: string | null;
  assignee?: { fullName: string } | null;
};

type Payment = {
  id: string;
  label: string;
  amountCents: number;
  dueDate: string;
  status: string;
  paidAt?: string | null;
  invoiceId?: string | null;
};

type Member = {
  role: string;
  user: { fullName: string; email: string };
};

type ClientUpdate = {
  id: string;
  title: string;
  body: string;
  processStage?: string | null;
  createdAt: string;
};

type Finance = {
  revenueCents: number;
  spentCents: number;
  profitCents: number;
  marginPct: number | null;
  nextPaymentCents: number;
  nextPaymentAt: string | null;
  overdueCount: number;
  overdueCents: number;
};

type ProjectDetail = {
  id: string;
  projectCode: string;
  name: string;
  description?: string | null;
  status: string;
  progressPct?: number;
  startDate?: string | null;
  endDate?: string | null;
  clientBrief?: string | null;
  nextSteps?: string | null;
  nextProcess?: string | null;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    company?: string | null;
    profile?: { customerCode?: string | null; phone?: string | null } | null;
  } | null;
  milestones: Milestone[];
  tasks: Task[];
  payments: Payment[];
  members: Member[];
  clientUpdates: ClientUpdate[];
  finance?: Finance;
};

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s.includes("COMPLETE") || s === "DONE" || s === "PAID") return "stitch-chip stitch-badge-done";
  if (s.includes("HOLD") || s === "PENDING") return "stitch-chip stitch-badge-pending";
  if (s.includes("CANCEL") || s === "OVERDUE") return "stitch-chip stitch-badge-danger";
  if (s.includes("PROGRESS") || s === "ACTIVE") return "stitch-chip stitch-badge-progress";
  return "stitch-chip stitch-chip-violet";
}

function taskStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "DONE") return "stitch-chip stitch-badge-done";
  if (s === "IN_PROGRESS") return "stitch-chip stitch-badge-progress";
  if (s === "BLOCKED") return "stitch-chip stitch-badge-danger";
  return "stitch-chip";
}

type Tab =
  | "overview"
  | "milestones"
  | "tasks"
  | "updates"
  | "timeline"
  | "resources"
  | "backlog"
  | "devnotes"
  | "finance"
  | "services";

export function StaffProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [serviceProjectId, setServiceProjectId] = useState<string | null>(null);
  const [serviceProjectLoading, setServiceProjectLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/erp/projects?projectId=${encodeURIComponent(projectId)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load project");
        const row = d.projects?.[0];
        if (!row) throw new Error("Project not found");
        setProject(row);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab !== "services" && tab !== "finance") return;
    setServiceProjectLoading(true);
    fetch(`/api/staff/service-projects?erpProjectId=${encodeURIComponent(projectId)}&limit=1`)
      .then(async (r) => {
        const d = await r.json();
        if (d.success && d.data?.[0]?.id) {
          setServiceProjectId(d.data[0].id);
        } else {
          setServiceProjectId(null);
        }
      })
      .catch(() => setServiceProjectId(null))
      .finally(() => setServiceProjectLoading(false));
  }, [tab, projectId]);

  if (loading) {
    return (
      <p className="stitch-page-sub flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading project…
      </p>
    );
  }

  if (error || !project) {
    return (
      <div>
        <p className="stitch-auth-error mb-4">{error || "Project not found"}</p>
        <Link href="/staff/projects" className="stitch-btn-sm">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
      </div>
    );
  }

  const client = project.customer;
  const finance = project.finance;
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const pendingTasks = project.tasks.filter((t) => t.status !== "DONE" && !t.parentId);
  const completedTasks = project.tasks.filter((t) => t.status === "DONE" && !t.parentId);

  return (
    <div>
      <div className="stitch-breadcrumb">
        <Link href="/staff">Dashboard</Link> &gt;{" "}
        <Link href="/staff/projects">Projects</Link> &gt; {project.name}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="stitch-page-title !mb-0">{project.name}</h1>
            <span className={statusBadge(project.status)}>{project.status}</span>
          </div>
          <p className="text-sm text-[var(--sp-muted)] font-mono">{project.projectCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/staff/projects" className="stitch-btn-outline-sm">
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Link>
          <Link href={`/admin/erp/projects`} className="stitch-btn-primary-sm">
            Open in ERP
          </Link>
        </div>
      </div>

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-blue">
            <FileText className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{project.progressPct ?? 0}%</div>
          <div className="stitch-kpi-label">Progress</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-green">
            <Users className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">
            {doneTasks}/{project.tasks.length}
          </div>
          <div className="stitch-kpi-label">Tasks done</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-orange">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value text-lg">
            {finance ? formatMoney(finance.revenueCents) : "—"}
          </div>
          <div className="stitch-kpi-label">Contract value</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-purple">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value text-base">
            {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
          </div>
          <div className="stitch-kpi-label">Target end</div>
        </div>
      </div>

      <div className="stitch-tab-row mb-4">
        {(
          [
            ["overview", "Overview"],
            ["milestones", `Milestones (${project.milestones.length})`],
            ["tasks", `Tasks (${project.tasks.length})`],
            ["updates", "Updates"],
            ["timeline", "Timeline"],
            ["resources", "Resources"],
            ["backlog", "Backlog"],
            ["devnotes", "Dev notes"],
            ["services", "Services"],
            ["finance", "Finance"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <section className="stitch-section-card lg:col-span-2">
            <div className="stitch-section-head">
              <h3>Project summary</h3>
            </div>
            <div className="stitch-section-body space-y-4">
              {project.clientBrief ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] mb-1">
                    Brief
                  </p>
                  <p className="text-sm">{project.clientBrief}</p>
                </div>
              ) : null}
              {project.nextProcess ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] mb-1">
                    Current phase
                  </p>
                  <p className="text-sm">{project.nextProcess}</p>
                </div>
              ) : null}
              {project.nextSteps ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] mb-1">
                    Next steps
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{project.nextSteps}</p>
                </div>
              ) : null}
              {project.description ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] mb-1">
                    Scope & details
                  </p>
                  <pre className="text-sm whitespace-pre-wrap font-sans text-[var(--sp-on)]">
                    {project.description}
                  </pre>
                </div>
              ) : null}
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[var(--sp-muted)]">Started</span>
                  <p className="font-medium">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--sp-muted)]">Target end</span>
                  <p className="font-medium">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-5">
            {client ? (
              <section className="stitch-section-card">
                <div className="stitch-section-head">
                  <h3>Client</h3>
                  <Link href="/staff/clients" className="stitch-btn-sm">
                    View clients
                  </Link>
                </div>
                <div className="stitch-section-body space-y-2 text-sm">
                  <p className="font-medium">{client.company || client.fullName}</p>
                  {client.company && client.fullName !== client.company ? (
                    <p className="text-[var(--sp-muted)]">{client.fullName}</p>
                  ) : null}
                  {client.profile?.customerCode ? (
                    <p className="font-mono text-xs text-[var(--stitch-primary)]">
                      {client.profile.customerCode}
                    </p>
                  ) : null}
                  <p className="flex items-center gap-2 text-[var(--sp-muted)]">
                    <Mail className="h-3.5 w-3.5" />
                    {client.email}
                  </p>
                  {client.profile?.phone ? (
                    <p className="flex items-center gap-2 text-[var(--sp-muted)]">
                      <Phone className="h-3.5 w-3.5" />
                      {client.profile.phone}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <ProjectTeamPanel projectId={projectId} />
          </div>
        </div>
      )}

      {tab === "milestones" && (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                {project.milestones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-[var(--sp-muted)] py-8">
                      No milestones yet.
                    </td>
                  </tr>
                ) : (
                  project.milestones.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium">{m.title}</td>
                      <td>
                        <span className={statusBadge(m.status)}>{m.status}</span>
                      </td>
                      <td>{m.progressPct ?? 0}%</td>
                      <td>{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "tasks" && (
        <div className="space-y-5">
          {project.nextSteps ? (
            <section className="stitch-section-card">
              <div className="stitch-section-head">
                <h3>Next steps</h3>
              </div>
              <div className="stitch-section-body">
                <p className="text-sm whitespace-pre-wrap m-0">{project.nextSteps}</p>
              </div>
            </section>
          ) : null}

          <div className="grid lg:grid-cols-2 gap-5">
            <section className="stitch-section-card">
              <div className="stitch-section-head">
                <h3>Pending tasks ({pendingTasks.length})</h3>
              </div>
              <div className="stitch-section-body space-y-2">
                {pendingTasks.length === 0 ? (
                  <p className="text-sm text-[var(--sp-muted)]">No pending tasks.</p>
                ) : (
                  pendingTasks.map((t) => (
                    <div key={t.id} className="flex justify-between gap-2 text-sm border-b border-[var(--sp-outline)] pb-2">
                      <span>{t.title}</span>
                      <span className={taskStatusBadge(t.status)}>{t.status}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
            <section className="stitch-section-card">
              <div className="stitch-section-head">
                <h3>Completed ({completedTasks.length})</h3>
              </div>
              <div className="stitch-section-body space-y-2">
                {completedTasks.length === 0 ? (
                  <p className="text-sm text-[var(--sp-muted)]">No completed tasks yet.</p>
                ) : (
                  completedTasks.slice(0, 12).map((t) => (
                    <div key={t.id} className="text-sm border-b border-[var(--sp-outline)] pb-2">
                      {t.title}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="stitch-section-card">
            <div className="stitch-section-body overflow-x-auto !p-0">
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Progress</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {project.tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-[var(--sp-muted)] py-8">
                        No tasks yet.
                      </td>
                    </tr>
                  ) : (
                    project.tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="font-medium">{t.title}</td>
                        <td>{t.assignee?.fullName || "—"}</td>
                        <td>
                          <span className={taskStatusBadge(t.status)}>{t.status}</span>
                        </td>
                        <td>{t.priority}</td>
                        <td>
                          <div className="stitch-progress-cell">
                            <div className="stitch-progress-bar">
                              <div style={{ width: `${t.progressPct}%` }} />
                            </div>
                            <span>{t.progressPct}%</span>
                          </div>
                        </td>
                        <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "updates" && <ProjectUpdatesPanel projectId={projectId} />}

      {tab === "timeline" && (
        <ProjectTimelinePanel milestones={project.milestones} updates={project.clientUpdates} />
      )}

      {tab === "resources" && <ProjectResourcesPanel projectId={projectId} />}

      {tab === "backlog" && <ProjectBacklogPanel projectId={projectId} />}

      {tab === "devnotes" && <ProjectDevNotesPanel projectId={projectId} />}

      {tab === "services" && (
        <div className="space-y-4">
          {serviceProjectLoading ? (
            <p className="stitch-page-sub flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading service project…
            </p>
          ) : serviceProjectId ? (
            <ProjectServicesPanel projectId={serviceProjectId} />
          ) : (
            <section className="stitch-section-card">
              <div className="stitch-section-body text-sm space-y-3">
                <p className="m-0 text-[var(--sp-muted)]">
                  No service project is linked to this ERP delivery project yet. Create one to
                  attach domains, hosting, SSL, and other billable services.
                </p>
                <Link
                  href={`/staff/service-projects?erpProjectId=${encodeURIComponent(projectId)}&name=${encodeURIComponent(project.name)}`}
                  className="stitch-btn-primary-sm inline-flex"
                >
                  Create service project
                </Link>
              </div>
            </section>
          )}
        </div>
      )}

      {tab === "finance" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>Financial summary</h3>
            </div>
            <div className="stitch-section-body space-y-3 text-sm">
              {finance ? (
                <>
                  <div className="stitch-row">
                    <span className="text-[var(--sp-muted)]">Contract value</span>
                    <strong>{formatMoney(finance.revenueCents)}</strong>
                  </div>
                  <div className="stitch-row">
                    <span className="text-[var(--sp-muted)]">Collected / spent</span>
                    <span>{formatMoney(finance.spentCents)}</span>
                  </div>
                  <div className="stitch-row">
                    <span className="text-[var(--sp-muted)]">Profit</span>
                    <strong className="text-emerald-600">{formatMoney(finance.profitCents)}</strong>
                  </div>
                  {finance.marginPct != null ? (
                    <div className="stitch-row">
                      <span className="text-[var(--sp-muted)]">Margin</span>
                      <span>{finance.marginPct}%</span>
                    </div>
                  ) : null}
                  <div className="stitch-row">
                    <span className="text-[var(--sp-muted)]">Next payment</span>
                    <span>
                      {finance.nextPaymentCents
                        ? `${formatMoney(finance.nextPaymentCents)}${
                            finance.nextPaymentAt
                              ? ` · ${new Date(finance.nextPaymentAt).toLocaleDateString()}`
                              : ""
                          }`
                        : "—"}
                    </span>
                  </div>
                  {finance.overdueCount > 0 ? (
                    <p className="stitch-auth-error text-xs !mb-0">
                      {finance.overdueCount} overdue payment(s) · {formatMoney(finance.overdueCents)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-[var(--sp-muted)]">No finance data.</p>
              )}
            </div>
          </section>

          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>Payment schedule</h3>
              <div className="flex gap-2">
                {serviceProjectId ? (
                  <a
                    href={`/api/staff/service-projects/${serviceProjectId}/billing/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stitch-btn-sm"
                  >
                    Billing history PDF
                  </a>
                ) : null}
                <Link href="/staff/invoices" className="stitch-btn-sm">
                  Invoices
                </Link>
              </div>
            </div>
            <div className="stitch-section-body overflow-x-auto !p-0">
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {project.payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-[var(--sp-muted)] py-6">
                        No payment schedule.
                      </td>
                    </tr>
                  ) : (
                    project.payments.map((pay) => (
                      <tr key={pay.id}>
                        <td>
                          {pay.label}
                          {pay.invoiceId ? (
                            <a
                              href={`/api/invoices/${pay.invoiceId}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-400 block"
                            >
                              View invoice
                            </a>
                          ) : null}
                        </td>
                        <td>{formatMoney(pay.amountCents)}</td>
                        <td>{new Date(pay.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={statusBadge(pay.status)}>{pay.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
