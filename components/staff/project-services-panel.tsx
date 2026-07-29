"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Globe2, Loader2, Plus, Server } from "lucide-react";
import type { BillingCycle, ServiceType } from "@prisma/client";
import { formatSriLankaDate } from "@/lib/timezone";
import { getServiceTypeLabel } from "@/shared/service-types";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";

type ProjectService = {
  id: string;
  projectId: string;
  serviceType: ServiceType;
  status: string;
  startDate: string;
  freePeriodDays: number | null;
  billingCycle: BillingCycle;
  renewalDate: string | null;
  expiryDate: string | null;
  createdAt: string;
};

type EnrichedService = ProjectService & {
  domainId?: string | null;
  hostingId?: string | null;
};

const SERVICE_TYPES: ServiceType[] = [
  "DOMAIN_REGISTRATION",
  "HOSTING",
  "SECURITY",
  "SSL_CERTIFICATE",
  "CLOUD_SERVICE",
  "EMAIL_HOSTING",
  "MAINTENANCE",
  "BACKUP",
  "OTHER",
];

const BILLING_CYCLES: BillingCycle[] = ["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"];

function statusChip(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "stitch-chip stitch-badge-done";
  if (s === "PENDING" || s === "ON_HOLD") return "stitch-chip stitch-badge-pending";
  if (s === "CANCELLED" || s === "EXPIRED") return "stitch-chip stitch-badge-danger";
  return "stitch-chip stitch-chip-violet";
}

export function ProjectServicesPanel({ projectId }: { projectId: string }) {
  const [services, setServices] = useState<EnrichedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    serviceType: "DOMAIN_REGISTRATION" as ServiceType,
    startDate: new Date().toISOString().slice(0, 10),
    billingCycle: "ANNUAL" as BillingCycle,
    freePeriodDays: "",
    renewalCostLkr: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`/api/projects/${projectId}/services?limit=100`).then((r) => r.json()),
      fetch(`/api/staff/service-projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([servicesRes, detailRes]) => {
        if (!servicesRes.success) {
          throw new Error(servicesRes.error?.message ?? "Failed to load services");
        }

        const enrichment = new Map<
          string,
          { domainId: string | null; hostingId: string | null }
        >();
        if (detailRes.success && detailRes.data?.services) {
          for (const s of detailRes.data.services as Array<{
            id: string;
            domain?: { id: string } | null;
            hosting?: { id: string } | null;
          }>) {
            enrichment.set(s.id, {
              domainId: s.domain?.id ?? null,
              hostingId: s.hosting?.id ?? null,
            });
          }
        }

        const rows = (servicesRes.data ?? []) as ProjectService[];
        setServices(
          rows.map((s) => ({
            ...s,
            domainId: enrichment.get(s.id)?.domainId ?? null,
            hostingId: enrichment.get(s.id)?.hostingId ?? null,
          }))
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function attachService(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const startDate = new Date(`${form.startDate}T00:00:00.000Z`).toISOString();
    const freePeriodDays = form.freePeriodDays ? Number(form.freePeriodDays) : null;
    const renewalCostCents = form.renewalCostLkr
      ? Math.round(Number(form.renewalCostLkr) * 100)
      : undefined;
    const metadata =
      renewalCostCents && renewalCostCents > 0 ? { renewalCostCents } : undefined;

    try {
      const r = await fetch(`/api/projects/${projectId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: form.serviceType,
          startDate,
          billingCycle: form.billingCycle,
          freePeriodDays,
          metadata,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to attach service");

      setShowForm(false);
      setForm({
        serviceType: "DOMAIN_REGISTRATION",
        startDate: new Date().toISOString().slice(0, 10),
        billingCycle: "ANNUAL",
        freePeriodDays: "",
        renewalCostLkr: "",
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function setupLink(service: EnrichedService) {
    if (service.serviceType === "DOMAIN_REGISTRATION") {
      if (service.domainId) {
        return {
          href: `/staff/domains/managed/${service.domainId}`,
          label: "View domain",
          icon: Globe2,
        };
      }
      return {
        href: `/staff/service-projects/${projectId}?setup=domain&serviceId=${service.id}`,
        label: "Setup domain",
        icon: Globe2,
      };
    }
    if (service.serviceType === "HOSTING") {
      if (service.hostingId) {
        return {
          href: `/staff/hosting/managed/${service.hostingId}`,
          label: "View hosting",
          icon: Server,
        };
      }
      return {
        href: `/staff/service-projects/${projectId}?setup=hosting&serviceId=${service.id}`,
        label: "Setup hosting",
        icon: Server,
      };
    }
    return null;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold m-0">Project services</h3>
          <p className="text-sm text-[var(--sp-muted)] m-0">
            Domains, hosting, and other billable services attached to this project.
          </p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Attach service
        </button>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      {loading ? (
        <LoadingState />
      ) : error && services.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No services attached"
          description="Attach a domain, hosting, or other service to this project."
        />
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>Billing</th>
                  <th>Renewal</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => {
                  const link = setupLink(s);
                  const Icon = link?.icon;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="font-medium">{getServiceTypeLabel(s.serviceType)}</span>
                        <span className="text-xs text-[var(--sp-muted)] block font-mono">{s.id.slice(0, 8)}…</span>
                      </td>
                      <td>
                        <span className={statusChip(s.status)}>{s.status}</span>
                      </td>
                      <td>{formatSriLankaDate(s.startDate)}</td>
                      <td>
                        {s.billingCycle.replace("_", " ")}
                        {s.freePeriodDays ? (
                          <span className="text-xs text-[var(--sp-muted)] block">
                            {s.freePeriodDays}d free
                          </span>
                        ) : null}
                      </td>
                      <td>{formatSriLankaDate(s.renewalDate)}</td>
                      <td>
                        {link && Icon ? (
                          <Link href={link.href} className="stitch-btn-outline-sm inline-flex">
                            <Icon className="h-3.5 w-3.5" />
                            {link.label}
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--sp-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showForm ? (
        <div className="stitch-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="stitch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Attach service</h3>
              <button type="button" className="stitch-btn-sm" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form onSubmit={attachService} className="stitch-modal-body space-y-4 text-sm">
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Service type</span>
                <select
                  className="stitch-input w-full"
                  value={form.serviceType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, serviceType: e.target.value as ServiceType }))
                  }
                  required
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {getServiceTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Start date</span>
                <input
                  type="date"
                  className="stitch-input w-full"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Billing cycle</span>
                <select
                  className="stitch-input w-full"
                  value={form.billingCycle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billingCycle: e.target.value as BillingCycle }))
                  }
                >
                  {BILLING_CYCLES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Free period (days)</span>
                <input
                  type="number"
                  min={0}
                  className="stitch-input w-full"
                  value={form.freePeriodDays}
                  onChange={(e) => setForm((f) => ({ ...f, freePeriodDays: e.target.value }))}
                  placeholder="Optional"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Renewal price (LKR)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="stitch-input w-full"
                  value={form.renewalCostLkr}
                  onChange={(e) => setForm((f) => ({ ...f, renewalCostLkr: e.target.value }))}
                  placeholder="Used for auto renewal invoices"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="stitch-btn-outline-sm" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Attach"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
