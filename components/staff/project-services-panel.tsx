"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Globe2, Loader2, Plus, Server } from "lucide-react";
import type { BillingCycle, ServiceType } from "@prisma/client";
import { formatSriLankaDate } from "@/lib/timezone";
import { getServiceTypeLabel } from "@/shared/service-types";
import { calculateServiceDates, FREE_PERIOD_PRESETS } from "@/shared/renewal-calculator";
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
  metadata: unknown;
  createdAt: string;
  domain?: { id: string; domainName: string } | null;
  hosting?: { id: string; packageName: string } | null;
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

function readMeta(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

export function ProjectServicesPanel({
  erpProjectId,
  onChanged,
}: {
  erpProjectId: string;
  onChanged?: () => void;
}) {
  const [services, setServices] = useState<ProjectService[]>([]);
  const [serviceProjectId, setServiceProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    serviceType: "DOMAIN_REGISTRATION" as ServiceType,
    startDate: new Date().toISOString().slice(0, 10),
    billingCycle: "ANNUAL" as BillingCycle,
    freePeriodPreset: "0",
    renewalCostLkr: "",
    serviceCostLkr: "",
    notes: "",
    assignedStaffId: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/staff/projects/${erpProjectId}/services`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed to load services");
        setServices(d.data?.services ?? []);
        setServiceProjectId(d.data?.serviceProjectId ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [erpProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const datePreview = useMemo(() => {
    const freePeriodDays = Number(form.freePeriodPreset) || 0;
    const startDate = new Date(`${form.startDate}T00:00:00.000Z`);
    if (Number.isNaN(startDate.getTime())) return null;
    const dates = calculateServiceDates({
      startDate,
      freePeriodDays,
      billingCycle: form.billingCycle,
    });
    return dates;
  }, [form.startDate, form.freePeriodPreset, form.billingCycle]);

  async function attachService(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const startDate = new Date(`${form.startDate}T00:00:00.000Z`).toISOString();
    const freePeriodDays = Number(form.freePeriodPreset) || 0;
    const renewalCostCents = form.renewalCostLkr
      ? Math.round(Number(form.renewalCostLkr) * 100)
      : undefined;
    const serviceCostCents = form.serviceCostLkr
      ? Math.round(Number(form.serviceCostLkr) * 100)
      : undefined;
    const metadata: Record<string, unknown> = {};
    if (renewalCostCents && renewalCostCents > 0) metadata.renewalCostCents = renewalCostCents;
    if (serviceCostCents && serviceCostCents > 0) metadata.serviceCostCents = serviceCostCents;
    if (form.notes.trim()) metadata.notes = form.notes.trim();
    if (form.assignedStaffId.trim()) metadata.assignedStaffId = form.assignedStaffId.trim();

    try {
      const r = await fetch(`/api/staff/projects/${erpProjectId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: form.serviceType,
          startDate,
          billingCycle: form.billingCycle,
          freePeriodDays,
          metadata: Object.keys(metadata).length ? metadata : undefined,
          notes: form.notes.trim() || undefined,
          assignedStaffId: form.assignedStaffId.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to attach service");

      setShowForm(false);
      setForm({
        serviceType: "DOMAIN_REGISTRATION",
        startDate: new Date().toISOString().slice(0, 10),
        billingCycle: "ANNUAL",
        freePeriodPreset: "0",
        renewalCostLkr: "",
        serviceCostLkr: "",
        notes: "",
        assignedStaffId: "",
      });
      load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function setupLink(service: ProjectService) {
    if (service.serviceType === "DOMAIN_REGISTRATION") {
      if (service.domain) {
        return {
          href: `/staff/domains/managed/${service.domain.id}`,
          label: "View domain",
          icon: Globe2,
        };
      }
      return {
        href: `/staff/projects/${erpProjectId}?setup=domain&serviceId=${service.id}`,
        label: "Setup domain",
        icon: Globe2,
      };
    }
    if (service.serviceType === "HOSTING") {
      if (service.hosting) {
        return {
          href: `/staff/hosting/managed/${service.hosting.id}`,
          label: "View hosting",
          icon: Server,
        };
      }
      return {
        href: `/staff/projects/${erpProjectId}?setup=hosting&serviceId=${service.id}`,
        label: "Setup hosting",
        icon: Server,
      };
    }
    return null;
  }

  return (
    <DashboardCardShell
      title="Services"
      description="All billable services for this project — domains, hosting, security, and more."
      onAdd={() => setShowForm(true)}
    >
      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      {loading ? (
        <LoadingState />
      ) : error && services.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No services yet"
          description="Add a domain, hosting, or other service to this project."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((s) => {
            const link = setupLink(s);
            const Icon = link?.icon;
            const meta = readMeta(s.metadata);
            return (
              <div
                key={s.id}
                className="rounded-xl border border-[var(--sp-outline)] bg-[var(--stitch-surface-low)] p-4 space-y-3"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium m-0">{getServiceTypeLabel(s.serviceType)}</p>
                    <p className="text-xs text-[var(--sp-muted)] m-0">{s.serviceType}</p>
                  </div>
                  <span className={statusChip(s.status)}>{s.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--sp-muted)]">Activation</span>
                    <p className="m-0">{formatSriLankaDate(s.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-[var(--sp-muted)]">Renewal</span>
                    <p className="m-0">{s.renewalDate ? formatSriLankaDate(s.renewalDate) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-[var(--sp-muted)]">Expiry</span>
                    <p className="m-0">{s.expiryDate ? formatSriLankaDate(s.expiryDate) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-[var(--sp-muted)]">Cycle</span>
                    <p className="m-0">{s.billingCycle.replace("_", " ")}</p>
                  </div>
                  {s.freePeriodDays ? (
                    <div>
                      <span className="text-[var(--sp-muted)]">Free period</span>
                      <p className="m-0">{s.freePeriodDays} days</p>
                    </div>
                  ) : null}
                  {typeof meta.notes === "string" && meta.notes ? (
                    <div className="col-span-2">
                      <span className="text-[var(--sp-muted)]">Notes</span>
                      <p className="m-0">{meta.notes}</p>
                    </div>
                  ) : null}
                </div>
                {link && Icon ? (
                  <Link href={link.href} className="stitch-btn-outline-sm inline-flex">
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <div className="stitch-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="stitch-modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Add service</h3>
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
                <span className="text-[var(--sp-muted)]">Free period</span>
                <select
                  className="stitch-input w-full"
                  value={form.freePeriodPreset}
                  onChange={(e) => setForm((f) => ({ ...f, freePeriodPreset: e.target.value }))}
                >
                  {FREE_PERIOD_PRESETS.map((p) => (
                    <option key={p.days} value={String(p.days)}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              {datePreview ? (
                <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-xs space-y-1">
                  <p className="m-0">
                    <strong>Next billing:</strong> {formatSriLankaDate(datePreview.nextBillingDate)}
                  </p>
                  <p className="m-0">
                    <strong>Renewal date:</strong> {formatSriLankaDate(datePreview.renewalDate)}
                  </p>
                  <p className="m-0">
                    <strong>Expiry date:</strong> {formatSriLankaDate(datePreview.expiryDate)}
                  </p>
                </div>
              ) : null}
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Service cost (LKR)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="stitch-input w-full"
                  value={form.serviceCostLkr}
                  onChange={(e) => setForm((f) => ({ ...f, serviceCostLkr: e.target.value }))}
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
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Assigned staff ID</span>
                <input
                  className="stitch-input w-full"
                  value={form.assignedStaffId}
                  onChange={(e) => setForm((f) => ({ ...f, assignedStaffId: e.target.value }))}
                  placeholder="Optional user ID"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Notes</span>
                <textarea
                  className="stitch-input w-full min-h-[72px]"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="stitch-btn-outline-sm" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DashboardCardShell>
  );
}

function DashboardCardShell({
  title,
  description,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="stitch-section-card">
      <div className="stitch-section-head">
        <div>
          <h3 className="m-0 text-base">{title}</h3>
          <p className="text-sm text-[var(--sp-muted)] m-0 mt-1">{description}</p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add service
        </button>
      </div>
      <div className="stitch-section-body">{children}</div>
    </section>
  );
}
