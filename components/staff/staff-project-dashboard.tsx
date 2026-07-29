"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/commerce-format";
import { formatSriLankaDate } from "@/lib/timezone";
import type { ProjectHubData } from "@/lib/staff/project-hub";
import { ProjectServicesPanel } from "@/components/staff/project-services-panel";
import { ProjectTeamPanel } from "@/components/staff/project-team-panel";
import { ProjectUpdatesPanel } from "@/components/staff/project-updates-panel";
import { ProjectDevNotesPanel } from "@/components/staff/project-dev-notes-panel";
import { ProjectResourcesPanel } from "@/components/staff/project-resources-panel";
import { ServiceSetupModals } from "@/components/staff/service-setup-modals";
import {
  Activity,
  ArrowLeft,
  Briefcase,
  Calendar,
  Code2,
  CreditCard,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MessageSquare,
  Server,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

type ProjectSummary = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  progressPct: number;
  startDate?: string | null;
  endDate?: string | null;
  clientBrief?: string | null;
  nextSteps?: string | null;
  nextProcess?: string | null;
  milestones: Array<{ id: string; title: string; status: string; dueDate?: string | null }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    progressPct: number;
    dueDate?: string | null;
    assignee?: { fullName: string } | null;
  }>;
};

function statusChip(status: string) {
  const s = status.toUpperCase();
  if (s.includes("COMPLETE") || s === "DONE" || s === "PAID" || s === "ACTIVE") {
    return "stitch-chip stitch-badge-done";
  }
  if (s.includes("HOLD") || s === "PENDING") return "stitch-chip stitch-badge-pending";
  if (s.includes("CANCEL") || s === "OVERDUE") return "stitch-chip stitch-badge-danger";
  if (s.includes("PROGRESS")) return "stitch-chip stitch-badge-progress";
  return "stitch-chip stitch-chip-violet";
}

function DashboardCard({
  id,
  title,
  icon: Icon,
  children,
  action,
  className,
}: {
  id?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`stitch-section-card h-full ${className ?? ""}`}>
      <div className="stitch-section-head">
        <h3 className="flex items-center gap-2 m-0 text-base">
          <Icon className="h-4 w-4 text-violet-400" />
          {title}
        </h3>
        {action}
      </div>
      <div className="stitch-section-body">{children}</div>
    </section>
  );
}

export function StaffProjectDashboard({
  erpProjectId,
  project,
  hub,
  onReload,
}: {
  erpProjectId: string;
  project: ProjectSummary;
  hub: ProjectHubData;
  onReload: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setup = searchParams.get("setup");
  const serviceId = searchParams.get("serviceId");
  const serviceProjectId = hub.serviceProject?.id ?? null;

  const progressPct = hub.progress.percent;
  const pendingTasks = project.tasks.filter((t) => t.status !== "DONE" && !t.parentId).slice(0, 6);
  const completedMilestones = project.milestones.filter((m) => m.status === "DONE").length;

  const navItems = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "client", label: "Client" },
      { id: "services", label: "Services" },
      { id: "billing", label: "Billing" },
      { id: "resources", label: "Resources" },
      { id: "tasks", label: "Tasks" },
      { id: "activity", label: "Activity" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="stitch-breadcrumb">
        <Link href="/staff">Dashboard</Link> &gt;{" "}
        <Link href="/staff/projects">Projects</Link> &gt; {project.name}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="stitch-page-title !mb-0">{project.name}</h1>
            <span className={statusChip(project.status)}>{project.status.replace("_", " ")}</span>
          </div>
          <p className="text-sm text-[var(--sp-muted)] font-mono m-0">{project.projectCode}</p>
          {hub.progress.currentMilestone ? (
            <p className="text-xs text-[var(--sp-muted)] mt-1 m-0">
              Current phase: {hub.progress.currentMilestone}
            </p>
          ) : null}
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

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-5">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{progressPct}%</div>
          <div className="stitch-kpi-label">Progress</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">
            {completedMilestones}/{project.milestones.length}
          </div>
          <div className="stitch-kpi-label">Milestones</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">
            {hub.progress.completedTasks}/{hub.progress.totalTasks}
          </div>
          <div className="stitch-kpi-label">Tasks done</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-lg">{hub.services.length}</div>
          <div className="stitch-kpi-label">Services</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-lg">{formatMoney(hub.billing.summary.paidCents)}</div>
          <div className="stitch-kpi-label">Collected</div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 sticky top-0 z-10 py-2 bg-[var(--sp-bg)]/90 backdrop-blur border-b border-[var(--sp-outline)]">
        {navItems.map((item) => (
          <a key={item.id} href={`#${item.id}`} className="stitch-btn-sm">
            {item.label}
          </a>
        ))}
      </nav>

      <div id="overview" className="grid lg:grid-cols-4 gap-5 scroll-mt-24">
        <DashboardCard title="Project overview" icon={Briefcase} className="lg:col-span-2">
          <div className="space-y-3 text-sm">
            {project.clientBrief ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--sp-muted)] mb-1">Brief</p>
                <p className="m-0">{project.clientBrief}</p>
              </div>
            ) : null}
            {project.nextProcess ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--sp-muted)] mb-1">Status</p>
                <p className="m-0">{project.nextProcess}</p>
              </div>
            ) : null}
            {project.nextSteps ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--sp-muted)] mb-1">Next steps</p>
                <p className="m-0 whitespace-pre-wrap">{project.nextSteps}</p>
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div>
                <p className="text-xs text-[var(--sp-muted)] m-0">Started</p>
                <p className="m-0 font-medium">
                  {project.startDate ? formatSriLankaDate(project.startDate) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--sp-muted)] m-0">Target end</p>
                <p className="m-0 font-medium">
                  {project.endDate ? formatSriLankaDate(project.endDate) : "—"}
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          id="client"
          title="Client information"
          icon={Users}
          action={
            hub.client ? (
              <Link href={`/staff/clients/${hub.client.id}`} className="stitch-btn-sm">
                View
              </Link>
            ) : null
          }
        >
          {hub.client ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium m-0">{hub.client.fullName}</p>
              {hub.client.company ? (
                <p className="text-[var(--sp-muted)] m-0">{hub.client.company}</p>
              ) : null}
              <p className="m-0 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> {hub.client.email}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--sp-muted)]">No client linked.</p>
          )}
        </DashboardCard>

        <DashboardCard title="Project status" icon={Activity}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--sp-muted)]">Delivery status</span>
              <span className={statusChip(project.status)}>{project.status.replace(/_/g, " ")}</span>
            </div>
            {hub.serviceProject ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--sp-muted)]">Service project</span>
                <span className={statusChip(hub.serviceProject.status)}>
                  {hub.serviceProject.status.replace(/_/g, " ")}
                </span>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-[var(--sp-muted)] m-0 mb-1">Progress</p>
              <div className="h-2 rounded-full bg-[var(--sp-outline)] overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-[var(--sp-muted)] m-0 mt-1">{progressPct}% complete</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <DashboardCard title="Assigned team" icon={Users}>
          {hub.team.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No team members assigned.</p>
          ) : (
            <ul className="space-y-2 text-sm m-0 p-0 list-none">
              {hub.team.map((m) => (
                <li key={`${m.user.id}-${m.role}`} className="flex justify-between gap-2">
                  <span>{m.user.fullName}</span>
                  <span className="text-xs text-[var(--sp-muted)]">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <ProjectTeamPanel projectId={erpProjectId} />
          </div>
        </DashboardCard>

        <DashboardCard
          id="billing"
          title="Billing summary"
          icon={Wallet}
          action={
            serviceProjectId ? (
              <a
                href={`/api/staff/service-projects/${serviceProjectId}/billing/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="stitch-btn-sm"
              >
                PDF
              </a>
            ) : null
          }
        >
          <div className="space-y-2 text-sm">
            <div className="stitch-row">
              <span className="text-[var(--sp-muted)]">Invoiced</span>
              <strong>{formatMoney(hub.billing.summary.invoicedCents)}</strong>
            </div>
            <div className="stitch-row">
              <span className="text-[var(--sp-muted)]">Paid</span>
              <span className="text-emerald-600">{formatMoney(hub.billing.summary.paidCents)}</span>
            </div>
            <div className="stitch-row">
              <span className="text-[var(--sp-muted)]">Outstanding</span>
              <span>{formatMoney(hub.billing.summary.balanceCents)}</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Renewal status" icon={Calendar}>
          {hub.renewals.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No upcoming renewals.</p>
          ) : (
            <ul className="space-y-2 text-sm m-0 p-0 list-none">
              {hub.renewals.slice(0, 5).map((r) => (
                <li key={r.serviceId} className="flex justify-between gap-2">
                  <span>{r.label}</span>
                  <span className="text-xs text-[var(--sp-muted)]">
                    {r.renewalDate ? formatSriLankaDate(r.renewalDate) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      <div id="services" className="scroll-mt-24 space-y-5">
        <ProjectServicesPanel erpProjectId={erpProjectId} onChanged={onReload} />

        {hub.servicesByType.domains.length > 0 ? (
          <DashboardCard title="Domain information" icon={Globe2}>
            <div className="grid md:grid-cols-2 gap-4">
              {hub.servicesByType.domains.map((s) => (
                <div key={s.id} className="rounded-xl border border-[var(--sp-outline)] p-4 text-sm space-y-2">
                  <div className="flex justify-between gap-2">
                    <strong className="font-mono">{s.domain?.domainName ?? "Domain"}</strong>
                    <span className={statusChip(s.status)}>{s.status}</span>
                  </div>
                  {s.domain ? (
                    <>
                      <p className="m-0 text-[var(--sp-muted)]">
                        Registrar: {s.domain.registrar || "—"}
                      </p>
                      <p className="m-0">
                        Registered: {formatSriLankaDate(s.domain.registrationDate)} · Expires:{" "}
                        {formatSriLankaDate(s.domain.expiryDate)}
                      </p>
                      <p className="m-0 text-xs text-[var(--sp-muted)]">
                        DNS records: {s.domain.dnsRecordCount ?? 0}
                        {s.domain.nameservers?.length
                          ? ` · NS: ${s.domain.nameservers.slice(0, 2).join(", ")}${s.domain.nameservers.length > 2 ? "…" : ""}`
                          : ""}
                      </p>
                      <p className="m-0">
                        Status: {s.domain.domainStatus} · SSL: {s.domain.sslCertificateStatus ?? "—"} ·
                        Auto-renew: {s.domain.autoRenew ? "Yes" : "No"}
                      </p>
                      <Link
                        href={`/staff/domains/managed/${s.domain.id}`}
                        className="stitch-btn-sm inline-flex mt-2"
                      >
                        Manage domain
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/staff/projects/${erpProjectId}?setup=domain&serviceId=${s.id}`}
                      className="stitch-btn-primary-sm inline-flex"
                    >
                      Complete domain setup
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </DashboardCard>
        ) : null}

        {hub.servicesByType.hosting.length > 0 ? (
          <DashboardCard title="Hosting information" icon={Server}>
            <div className="grid md:grid-cols-2 gap-4">
              {hub.servicesByType.hosting.map((s) => (
                <div key={s.id} className="rounded-xl border border-[var(--sp-outline)] p-4 text-sm">
                  <strong>{s.hosting?.packageName ?? "Hosting"}</strong>
                  {s.hosting ? (
                    <>
                      <p className="text-[var(--sp-muted)] mt-2 mb-0">
                        {s.hosting.diskQuotaMb} MB disk · {s.hosting.bandwidthQuotaMb} MB bandwidth
                      </p>
                      <Link
                        href={`/staff/hosting/managed/${s.hosting.id}`}
                        className="stitch-btn-sm inline-flex mt-3"
                      >
                        View hosting
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/staff/projects/${erpProjectId}?setup=hosting&serviceId=${s.id}`}
                      className="stitch-btn-primary-sm inline-flex mt-3"
                    >
                      Complete hosting setup
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </DashboardCard>
        ) : null}

        {hub.servicesByType.security.length + hub.servicesByType.ssl.length > 0 ? (
          <DashboardCard title="Security & SSL" icon={Shield}>
            <p className="text-sm text-[var(--sp-muted)]">
              {hub.servicesByType.security.length + hub.servicesByType.ssl.length} security service(s)
              attached to this project.
            </p>
          </DashboardCard>
        ) : null}

        <DashboardCard title="DNS status" icon={Globe2}>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--sp-muted)] m-0">Domains</p>
              <p className="font-medium m-0">{hub.dnsSummary.totalDomains}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--sp-muted)] m-0">Managed</p>
              <p className="font-medium m-0">{hub.dnsSummary.managedDomains}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--sp-muted)] m-0">DNS records</p>
              <p className="font-medium m-0">{hub.dnsSummary.totalRecords}</p>
            </div>
          </div>
          <Link href="/staff/dns" className="stitch-btn-sm inline-flex mt-3">
            Open DNS management
          </Link>
        </DashboardCard>
      </div>

      <div id="resources" className="grid lg:grid-cols-2 gap-5 scroll-mt-24">
        <DashboardCard title="Git repository" icon={Code2}>
          {hub.resources?.gitRepoUrl ? (
            <div className="space-y-2 text-sm">
              <p className="m-0">
                Provider: <strong>{hub.resources.gitProvider ?? "—"}</strong>
              </p>
              <p className="m-0 font-mono text-xs break-all">{hub.resources.gitRepoUrl}</p>
              <p className="m-0 text-[var(--sp-muted)]">
                Branch: {hub.resources.defaultBranch ?? "—"} · Deploy:{" "}
                {hub.resources.deploymentBranch ?? "—"}
              </p>
              {hub.resources.latestCommitSha ? (
                <p className="m-0 text-xs">
                  {hub.resources.latestCommitSha.slice(0, 7)} — {hub.resources.latestCommitMessage}
                </p>
              ) : null}
              <p className="m-0 text-xs text-[var(--sp-muted)]">
                Status: {hub.resources.repositoryStatus} · Client view:{" "}
                {hub.resources.clientCanViewGit ? "Allowed" : "Hidden"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--sp-muted)]">No repository linked.</p>
          )}
        </DashboardCard>

        <DashboardCard title="Deployment status" icon={Server}>
          {hub.deploymentStatus ? (
            <div className="space-y-2 text-sm">
              <p className="m-0">Method: {hub.deploymentStatus.method ?? "—"}</p>
              <p className="m-0">Version: {hub.deploymentStatus.lastDeployedVersion ?? "—"}</p>
              {hub.deploymentStatus.lastDeployedAt ? (
                <p className="m-0 text-[var(--sp-muted)]">
                  Last deployed: {formatSriLankaDate(hub.deploymentStatus.lastDeployedAt)}
                </p>
              ) : null}
              {hub.deploymentStatus.productionUrl ? (
                <p className="m-0 font-mono text-xs">{hub.deploymentStatus.productionUrl}</p>
              ) : null}
              {hub.deploymentStatus.devUrl ? (
                <p className="m-0 font-mono text-xs text-[var(--sp-muted)]">
                  Dev: {hub.deploymentStatus.devUrl}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[var(--sp-muted)]">No deployment information.</p>
          )}
        </DashboardCard>

        <div className="lg:col-span-2">
          <ProjectResourcesPanel projectId={erpProjectId} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <DashboardCard title="Invoice summary" icon={CreditCard}>
          {hub.billing.invoices.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {hub.billing.invoices.slice(0, 8).map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                      <td>
                        <span className={statusChip(inv.status)}>{inv.status}</span>
                      </td>
                      <td>{formatMoney(inv.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Documents" icon={FileText}>
          {hub.services.filter((s) => s.documentation).length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No domain documentation submissions yet.</p>
          ) : (
            <ul className="space-y-2 text-sm m-0 p-0 list-none">
              {hub.services
                .filter((s) => s.documentation)
                .map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <span>{s.label}</span>
                    <span className={statusChip(s.documentation!.status)}>
                      {s.documentation!.status.replace("_", " ")}
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <Link href="/staff/domain-docs" className="stitch-btn-sm inline-flex mt-3">
            Review domain docs
          </Link>
        </DashboardCard>
      </div>

      <div id="tasks" className="grid lg:grid-cols-2 gap-5 scroll-mt-24">
        <DashboardCard title="Tasks & milestones" icon={Calendar}>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--sp-muted)] mb-2">Milestones</p>
              {project.milestones.length === 0 ? (
                <p className="text-sm text-[var(--sp-muted)]">No milestones.</p>
              ) : (
                <ul className="space-y-2 text-sm m-0 p-0 list-none">
                  {project.milestones.map((m) => (
                    <li key={m.id} className="flex justify-between gap-2">
                      <span>{m.title}</span>
                      <span className={statusChip(m.status)}>{m.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--sp-muted)] mb-2">Pending tasks</p>
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-[var(--sp-muted)]">No pending tasks.</p>
              ) : (
                <ul className="space-y-2 text-sm m-0 p-0 list-none">
                  {pendingTasks.map((t) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Notes" icon={FileText}>
          <ProjectDevNotesPanel projectId={erpProjectId} />
        </DashboardCard>
      </div>

      <div id="activity" className="grid lg:grid-cols-2 gap-5 scroll-mt-24">
        <DashboardCard title="Recent updates" icon={MessageSquare}>
          <ProjectUpdatesPanel projectId={erpProjectId} />
        </DashboardCard>

        <DashboardCard title="Activity timeline" icon={Activity}>
          {hub.activity.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No activity yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {hub.activity.slice(0, 20).map((item) => (
                <div key={item.id} className="border-l-2 border-violet-500/30 pl-3 text-sm">
                  <p className="font-medium m-0">{item.title}</p>
                  <p className="text-xs text-[var(--sp-muted)] m-0 mt-1">
                    {formatSriLankaDate(item.at)}
                  </p>
                  {item.body ? (
                    <p className="text-[var(--sp-muted)] m-0 mt-1 line-clamp-2">{item.body}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Communication history"
          icon={Mail}
          action={
            hub.client ? (
              <Link href={`/staff/live-chat?clientId=${hub.client.id}`} className="stitch-btn-sm">
                Open chat
              </Link>
            ) : null
          }
        >
          {hub.clientUpdates.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No client communications logged yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {hub.clientUpdates.slice(0, 12).map((update) => (
                <div key={update.id} className="border-l-2 border-emerald-500/30 pl-3 text-sm">
                  <p className="font-medium m-0">{update.title}</p>
                  <p className="text-xs text-[var(--sp-muted)] m-0 mt-1">
                    {formatSriLankaDate(update.createdAt)}
                  </p>
                  {update.body ? (
                    <p className="text-[var(--sp-muted)] m-0 mt-1 line-clamp-3">{update.body}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      {serviceProjectId && setup && serviceId ? (
        <ServiceSetupModals
          erpProjectId={erpProjectId}
          serviceProjectId={serviceProjectId}
          setup={setup}
          serviceId={serviceId}
          onDone={() => {
            onReload();
            router.push(`/staff/projects/${erpProjectId}#services`);
          }}
        />
      ) : null}
    </div>
  );
}
