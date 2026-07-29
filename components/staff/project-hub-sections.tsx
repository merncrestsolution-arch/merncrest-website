"use client";

import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { formatSriLankaDate } from "@/lib/timezone";
import type { ProjectHubData } from "@/lib/staff/project-hub";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Globe2,
  Mail,
  Server,
  Shield,
  Wallet,
} from "lucide-react";

type HubService = ProjectHubData["services"][number];

function statusChip(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "DONE" || s === "APPROVED" || s === "PAID") {
    return "stitch-chip stitch-badge-done";
  }
  if (s === "PENDING" || s === "ON_HOLD" || s === "PENDING_REVIEW") {
    return "stitch-chip stitch-badge-pending";
  }
  if (s === "CANCELLED" || s === "REJECTED" || s === "EXPIRED" || s === "OVERDUE") {
    return "stitch-chip stitch-badge-danger";
  }
  if (s === "IN_PROGRESS") return "stitch-chip stitch-badge-progress";
  return "stitch-chip stitch-chip-violet";
}

function ServiceDetailCard({ service, serviceProjectId }: { service: HubService; serviceProjectId: string }) {
  const setupLink = () => {
    if (service.serviceType === "DOMAIN_REGISTRATION") {
      if (service.domain) return `/staff/domains/managed/${service.domain.id}`;
      return `/staff/service-projects/${serviceProjectId}?setup=domain&serviceId=${service.id}`;
    }
    if (service.serviceType === "HOSTING") {
      if (service.hosting) return `/staff/hosting/managed/${service.hosting.id}`;
      return `/staff/service-projects/${serviceProjectId}?setup=hosting&serviceId=${service.id}`;
    }
    return null;
  };

  const href = setupLink();

  return (
    <div className="rounded-xl border border-[var(--sp-outline)] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium m-0">{service.label}</p>
          <p className="text-xs text-[var(--sp-muted)] m-0 font-mono">{service.serviceType}</p>
        </div>
        <span className={statusChip(service.status)}>{service.status.replace("_", " ")}</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Activation</p>
          <p className="m-0">{formatSriLankaDate(service.startDate)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Expiry</p>
          <p className="m-0">{service.expiryDate ? formatSriLankaDate(service.expiryDate) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Renewal</p>
          <p className="m-0">{service.renewalDate ? formatSriLankaDate(service.renewalDate) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Free period</p>
          <p className="m-0">
            {service.freePeriodDays != null ? `${service.freePeriodDays} days` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Service cost</p>
          <p className="m-0">
            {service.serviceCostCents != null ? formatMoney(service.serviceCostCents) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Renewal cost</p>
          <p className="m-0">
            {service.renewalCostCents != null ? formatMoney(service.renewalCostCents) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Billing cycle</p>
          <p className="m-0">{service.billingCycle.replace("_", " ")}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--sp-muted)] m-0">Progress</p>
          <p className="m-0">{service.progressPct != null ? `${service.progressPct}%` : "—"}</p>
        </div>
        {service.domain ? (
          <div>
            <p className="text-xs text-[var(--sp-muted)] m-0">Domain</p>
            <p className="m-0 font-mono text-xs">{service.domain.domainName}</p>
          </div>
        ) : null}
        {service.hosting ? (
          <div>
            <p className="text-xs text-[var(--sp-muted)] m-0">Package</p>
            <p className="m-0">{service.hosting.packageName}</p>
          </div>
        ) : null}
      </div>

      {service.documentation ? (
        <div className="text-sm rounded-lg bg-[var(--stitch-primary-soft)] px-3 py-2">
          <span className="text-[var(--sp-muted)]">Documentation: </span>
          <span className={statusChip(service.documentation.status)}>
            {service.documentation.status.replace("_", " ")}
          </span>
          {service.documentation.reviewNotes ? (
            <p className="text-xs text-[var(--sp-muted)] mt-1 mb-0">
              {service.documentation.reviewNotes}
            </p>
          ) : null}
        </div>
      ) : null}

      {href ? (
        <Link href={href} className="stitch-btn-sm inline-flex">
          {service.domain || service.hosting ? "View service" : "Setup service"}
        </Link>
      ) : null}
    </div>
  );
}

export function ProjectHubOverview({ hub }: { hub: ProjectHubData }) {
  const { progress, finance, billing, client, serviceProject } = hub;

  return (
    <div className="space-y-5">
      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{progress.percent}%</div>
          <div className="stitch-kpi-label">Progress</div>
          {progress.currentMilestone ? (
            <p className="text-xs text-[var(--sp-muted)] mt-1 mb-0 truncate">
              {progress.currentMilestone}
            </p>
          ) : null}
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">
            {progress.completedMilestones}/{progress.totalMilestones}
          </div>
          <div className="stitch-kpi-label">Milestones</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">
            {progress.completedTasks}/{progress.totalTasks}
          </div>
          <div className="stitch-kpi-label">Tasks completed</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-lg">{formatMoney(billing.summary.paidCents)}</div>
          <div className="stitch-kpi-label">Collected</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Client information</h3>
            {client ? (
              <Link href={`/staff/clients/${client.id}`} className="stitch-btn-sm">
                View profile
              </Link>
            ) : null}
          </div>
          <div className="stitch-section-body space-y-2 text-sm">
            {client ? (
              <>
                <p className="m-0 font-medium">{client.fullName}</p>
                {client.company ? <p className="m-0 text-[var(--sp-muted)]">{client.company}</p> : null}
                <p className="m-0 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {client.email}
                </p>
                {client.profile?.phone ? (
                  <p className="m-0 text-[var(--sp-muted)]">Phone: {client.profile.phone}</p>
                ) : null}
                {client.profile?.customerCode ? (
                  <p className="m-0 font-mono text-xs">{client.profile.customerCode}</p>
                ) : null}
              </>
            ) : (
              <p className="text-[var(--sp-muted)]">No client linked.</p>
            )}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Billing summary</h3>
            {serviceProject ? (
              <a
                href={`/api/staff/service-projects/${serviceProject.id}/billing/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="stitch-btn-sm"
              >
                PDF
              </a>
            ) : null}
          </div>
          <div className="stitch-section-body space-y-2 text-sm">
            <div className="stitch-row">
              <span className="text-[var(--sp-muted)]">Invoiced</span>
              <strong>{formatMoney(billing.summary.invoicedCents)}</strong>
            </div>
            <div className="stitch-row">
              <span className="text-[var(--sp-muted)]">Paid</span>
              <span className="text-emerald-600">{formatMoney(billing.summary.paidCents)}</span>
            </div>
            <div className="stitch-row">
              <span className="text-[var(--sp-muted)]">Outstanding</span>
              <span>{formatMoney(billing.summary.balanceCents)}</span>
            </div>
            {finance ? (
              <div className="stitch-row">
                <span className="text-[var(--sp-muted)]">Contract value</span>
                <span>{formatMoney(finance.revenueCents)}</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Assigned team</h3>
          </div>
          <div className="stitch-section-body space-y-2 text-sm">
            {hub.team.length === 0 ? (
              <p className="text-[var(--sp-muted)]">No team members assigned.</p>
            ) : (
              hub.team.map((m) => (
                <div key={`${m.user.id}-${m.role}`} className="flex justify-between gap-2">
                  <span>{m.user.fullName}</span>
                  <span className="text-xs text-[var(--sp-muted)]">{m.role}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {hub.renewals.length > 0 ? (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Upcoming renewals</h3>
          </div>
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Renewal date</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hub.renewals.map((r) => (
                  <tr key={r.serviceId}>
                    <td>{r.label}</td>
                    <td>{r.renewalDate ? formatSriLankaDate(r.renewalDate) : "—"}</td>
                    <td>{r.renewalCostCents != null ? formatMoney(r.renewalCostCents) : "—"}</td>
                    <td>
                      <span className={statusChip(r.status)}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ProjectHubServices({ hub }: { hub: ProjectHubData }) {
  if (!hub.serviceProject) {
    return (
      <section className="stitch-section-card">
        <div className="stitch-section-body text-center py-8">
          <p className="text-[var(--sp-muted)] mb-4">
            No service project linked. Create one to attach domains, hosting, and billable services.
          </p>
          <Link
            href={`/staff/service-projects?erpProjectId=${hub.erpProject.id}&name=${encodeURIComponent(hub.erpProject.name)}`}
            className="stitch-btn-primary-sm"
          >
            Create service project
          </Link>
        </div>
      </section>
    );
  }

  const groups = [
    { key: "domains", label: "Domain services", icon: Globe2, items: hub.servicesByType.domains },
    { key: "hosting", label: "Hosting services", icon: Server, items: hub.servicesByType.hosting },
    { key: "security", label: "Security services", icon: Shield, items: hub.servicesByType.security },
    { key: "ssl", label: "SSL certificates", icon: Shield, items: hub.servicesByType.ssl },
    { key: "cloud", label: "Cloud services", icon: Server, items: hub.servicesByType.cloud },
    { key: "email", label: "Email hosting", icon: Mail, items: hub.servicesByType.email },
    {
      key: "maintenance",
      label: "Maintenance",
      icon: CheckCircle2,
      items: hub.servicesByType.maintenance,
    },
    { key: "other", label: "Other services", icon: FileText, items: hub.servicesByType.other },
  ].filter((g) => g.items.length > 0);

  if (hub.services.length === 0) {
    return (
      <section className="stitch-section-card">
        <div className="stitch-section-body text-center py-8">
          <p className="text-[var(--sp-muted)] mb-4">No services attached yet.</p>
          <Link href={`/staff/service-projects/${hub.serviceProject.id}`} className="stitch-btn-primary-sm">
            Attach services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key} className="stitch-section-card">
          <div className="stitch-section-head">
            <h3 className="flex items-center gap-2">
              <group.icon className="h-4 w-4" />
              {group.label} ({group.items.length})
            </h3>
          </div>
          <div className="stitch-section-body grid md:grid-cols-2 gap-4">
            {group.items.map((service) => (
              <ServiceDetailCard
                key={service.id}
                service={service}
                serviceProjectId={hub.serviceProject!.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ProjectHubBilling({ hub }: { hub: ProjectHubData }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Invoice history</h3>
          <Link href="/staff/invoices" className="stitch-btn-sm">
            All invoices
          </Link>
        </div>
        <div className="stitch-section-body overflow-x-auto !p-0">
          {hub.billing.invoices.length === 0 ? (
            <p className="p-4 text-sm text-[var(--sp-muted)]">No invoices yet.</p>
          ) : (
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {hub.billing.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                    <td>
                      <span className={statusChip(inv.status)}>{inv.status}</span>
                    </td>
                    <td>{formatMoney(inv.totalCents)}</td>
                    <td>{formatMoney(inv.paidCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Receipt history</h3>
          <Link href="/staff/receipts" className="stitch-btn-sm">
            All receipts
          </Link>
        </div>
        <div className="stitch-section-body overflow-x-auto !p-0">
          {hub.billing.receipts.length === 0 ? (
            <p className="p-4 text-sm text-[var(--sp-muted)]">No receipts yet.</p>
          ) : (
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {hub.billing.receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.receiptNumber || "—"}</td>
                    <td className="font-mono text-xs">{r.invoiceNumber || "—"}</td>
                    <td>{formatMoney(r.amountCents)}</td>
                    <td>{formatSriLankaDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export function ProjectHubActivity({ hub }: { hub: ProjectHubData }) {
  return (
    <section className="stitch-section-card">
      <div className="stitch-section-head">
        <h3>Activity timeline</h3>
      </div>
      <div className="stitch-section-body space-y-4">
        {hub.activity.length === 0 ? (
          <p className="text-sm text-[var(--sp-muted)]">No activity recorded yet.</p>
        ) : (
          hub.activity.map((item) => (
            <div key={item.id} className="flex gap-3 border-l-2 border-violet-500/30 pl-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-[var(--sp-muted)] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatSriLankaDate(item.at)}
                  </span>
                </div>
                {item.body ? (
                  <p className="text-sm text-[var(--sp-muted)] m-0 whitespace-pre-wrap">{item.body}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function ProjectHubTimeline({ hub }: { hub: ProjectHubData }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3 className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Milestones & timeline
          </h3>
        </div>
        <div className="stitch-section-body space-y-3">
          {hub.milestones.length === 0 ? (
            <p className="text-sm text-[var(--sp-muted)]">No milestones defined.</p>
          ) : (
            hub.milestones.map((m) => (
              <div key={m.id} className="flex justify-between gap-2 text-sm border-b border-[var(--sp-outline)] pb-2">
                <span>{m.title}</span>
                <div className="flex items-center gap-2">
                  <span className={statusChip(m.status)}>{m.status}</span>
                  {m.dueDate ? (
                    <span className="text-xs text-[var(--sp-muted)]">
                      {formatSriLankaDate(m.dueDate)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3 className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payment schedule
          </h3>
        </div>
        <div className="stitch-section-body overflow-x-auto !p-0">
          {hub.payments.length === 0 ? (
            <p className="p-4 text-sm text-[var(--sp-muted)]">No payment schedule.</p>
          ) : (
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Due</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hub.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.label}</td>
                    <td>{formatSriLankaDate(p.dueDate)}</td>
                    <td>{formatMoney(p.amountCents)}</td>
                    <td>
                      <span className={statusChip(p.status)}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
