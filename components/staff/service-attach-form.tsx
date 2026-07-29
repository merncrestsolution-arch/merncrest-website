"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { BillingCycle, ServiceType } from "@prisma/client";
import { calculateServiceDates, FREE_PERIOD_PRESETS } from "@/shared/renewal-calculator";
import { getServiceTypeLabel } from "@/shared/service-types";
import { DOMAIN_REGISTRARS } from "@/shared/domain-registrars";
import { formatSriLankaDate } from "@/lib/timezone";

export const SERVICE_TYPES: ServiceType[] = [
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

export const BILLING_CYCLES: BillingCycle[] = ["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"];

export type ServiceAttachFormState = {
  serviceType: ServiceType;
  startDate: string;
  billingCycle: BillingCycle;
  freePeriodPreset: string;
  serviceCostLkr: string;
  renewalCostLkr: string;
  notes: string;
  assignedStaffId: string;
  domainName: string;
  registrar: string;
  registrationPeriodMonths: string;
  purchasedViaMernCrest: boolean;
  autoRenew: boolean;
  nameservers: string;
  packageName: string;
  diskQuotaMb: string;
  bandwidthQuotaMb: string;
  serverLocation: string;
};

export const defaultServiceAttachForm = (): ServiceAttachFormState => ({
  serviceType: "DOMAIN_REGISTRATION",
  startDate: new Date().toISOString().slice(0, 10),
  billingCycle: "ANNUAL",
  freePeriodPreset: "0",
  serviceCostLkr: "",
  renewalCostLkr: "",
  notes: "",
  assignedStaffId: "",
  domainName: "",
  registrar: "REGISTRY_LK",
  registrationPeriodMonths: "12",
  purchasedViaMernCrest: true,
  autoRenew: true,
  nameservers: "",
  packageName: "",
  diskQuotaMb: "5120",
  bandwidthQuotaMb: "51200",
  serverLocation: "",
});

type Props = {
  form: ServiceAttachFormState;
  onChange: (next: ServiceAttachFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy?: boolean;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
};

export function ServiceAttachForm({
  form,
  onChange,
  onSubmit,
  busy,
  submitLabel = "Create service",
  showCancel,
  onCancel,
}: Props) {
  const set = <K extends keyof ServiceAttachFormState>(key: K, value: ServiceAttachFormState[K]) =>
    onChange({ ...form, [key]: value });

  const datePreview = useMemo(() => {
    const startDate = new Date(`${form.startDate}T00:00:00.000Z`);
    if (Number.isNaN(startDate.getTime())) return null;
    return calculateServiceDates({
      startDate,
      freePeriodDays: Number(form.freePeriodPreset) || 0,
      billingCycle: form.billingCycle,
    });
  }, [form.startDate, form.freePeriodPreset, form.billingCycle]);

  const isDomain = form.serviceType === "DOMAIN_REGISTRATION";
  const isHosting = form.serviceType === "HOSTING";

  return (
    <form onSubmit={onSubmit} className="space-y-6 text-sm pb-4">
      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] m-0">
          Service details
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-[var(--sp-muted)]">Service type</span>
            <select
              className="stitch-input w-full"
              value={form.serviceType}
              onChange={(e) => set("serviceType", e.target.value as ServiceType)}
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
            <span className="text-[var(--sp-muted)]">Activation date</span>
            <input
              type="date"
              className="stitch-input w-full"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[var(--sp-muted)]">Billing cycle</span>
            <select
              className="stitch-input w-full"
              value={form.billingCycle}
              onChange={(e) => set("billingCycle", e.target.value as BillingCycle)}
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-[var(--sp-muted)]">Free period</span>
            <select
              className="stitch-input w-full"
              value={form.freePeriodPreset}
              onChange={(e) => set("freePeriodPreset", e.target.value)}
            >
              {FREE_PERIOD_PRESETS.map((p) => (
                <option key={p.days} value={String(p.days)}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {datePreview ? (
          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-4 text-sm grid sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-[var(--sp-muted)] m-0">Next billing</p>
              <p className="font-medium m-0">{formatSriLankaDate(datePreview.nextBillingDate)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--sp-muted)] m-0">Renewal date</p>
              <p className="font-medium m-0">{formatSriLankaDate(datePreview.renewalDate)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--sp-muted)] m-0">Expiry date</p>
              <p className="font-medium m-0">{formatSriLankaDate(datePreview.expiryDate)}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] m-0">
          Billing & assignment
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-[var(--sp-muted)]">Service cost (LKR)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="stitch-input w-full"
              value={form.serviceCostLkr}
              onChange={(e) => set("serviceCostLkr", e.target.value)}
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
              onChange={(e) => set("renewalCostLkr", e.target.value)}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-[var(--sp-muted)]">Assigned staff ID (optional)</span>
            <input
              className="stitch-input w-full"
              value={form.assignedStaffId}
              onChange={(e) => set("assignedStaffId", e.target.value)}
              placeholder="User ID of assigned staff member"
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-[var(--sp-muted)]">Notes</span>
            <textarea
              className="stitch-input w-full min-h-[80px]"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Internal notes about this service"
            />
          </label>
        </div>
      </section>

      {isDomain ? (
        <section className="space-y-4 rounded-xl border border-[var(--sp-outline)] p-4 bg-[var(--stitch-surface-low)]">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] m-0">
            Domain information
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[var(--sp-muted)]">Domain name</span>
              <input
                className="stitch-input w-full font-mono"
                value={form.domainName}
                onChange={(e) => set("domainName", e.target.value)}
                placeholder="example.lk"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Registrar</span>
              <select
                className="stitch-input w-full"
                value={form.registrar}
                onChange={(e) => set("registrar", e.target.value)}
              >
                {DOMAIN_REGISTRARS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Registration period (months)</span>
              <input
                type="number"
                min={1}
                max={120}
                className="stitch-input w-full"
                value={form.registrationPeriodMonths}
                onChange={(e) => set("registrationPeriodMonths", e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.purchasedViaMernCrest}
                onChange={(e) => set("purchasedViaMernCrest", e.target.checked)}
              />
              <span>Purchased / managed via MernCrest</span>
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.autoRenew}
                onChange={(e) => set("autoRenew", e.target.checked)}
              />
              <span>Auto-renew enabled</span>
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[var(--sp-muted)]">Nameservers (one per line)</span>
              <textarea
                className="stitch-input w-full min-h-[72px] font-mono text-xs"
                value={form.nameservers}
                onChange={(e) => set("nameservers", e.target.value)}
                placeholder={"ns1.example.com\nns2.example.com"}
              />
            </label>
          </div>
        </section>
      ) : null}

      {isHosting ? (
        <section className="space-y-4 rounded-xl border border-[var(--sp-outline)] p-4 bg-[var(--stitch-surface-low)]">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)] m-0">
            Hosting package
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[var(--sp-muted)]">Package name</span>
              <input
                className="stitch-input w-full"
                value={form.packageName}
                onChange={(e) => set("packageName", e.target.value)}
                placeholder="Business Hosting"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Disk quota (MB)</span>
              <input
                type="number"
                min={0}
                className="stitch-input w-full"
                value={form.diskQuotaMb}
                onChange={(e) => set("diskQuotaMb", e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[var(--sp-muted)]">Bandwidth quota (MB)</span>
              <input
                type="number"
                min={0}
                className="stitch-input w-full"
                value={form.bandwidthQuotaMb}
                onChange={(e) => set("bandwidthQuotaMb", e.target.value)}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[var(--sp-muted)]">Server location</span>
              <input
                className="stitch-input w-full"
                value={form.serverLocation}
                onChange={(e) => set("serverLocation", e.target.value)}
                placeholder="Singapore / US-East"
              />
            </label>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--sp-outline)]">
        {showCancel && onCancel ? (
          <button type="button" className="stitch-btn-outline-sm" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="stitch-btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function buildServicePayload(form: ServiceAttachFormState) {
  const metadata: Record<string, unknown> = {};
  if (form.serviceCostLkr) metadata.serviceCostCents = Math.round(Number(form.serviceCostLkr) * 100);
  if (form.renewalCostLkr) metadata.renewalCostCents = Math.round(Number(form.renewalCostLkr) * 100);
  if (form.notes.trim()) metadata.notes = form.notes.trim();
  if (form.assignedStaffId.trim()) metadata.assignedStaffId = form.assignedStaffId.trim();

  return {
    serviceType: form.serviceType,
    startDate: new Date(`${form.startDate}T00:00:00.000Z`).toISOString(),
    billingCycle: form.billingCycle,
    freePeriodDays: Number(form.freePeriodPreset) || 0,
    metadata: Object.keys(metadata).length ? metadata : undefined,
    notes: form.notes.trim() || undefined,
    assignedStaffId: form.assignedStaffId.trim() || undefined,
  };
}

export async function attachDomainOrHosting(
  serviceProjectId: string,
  serviceId: string,
  form: ServiceAttachFormState,
  datePreview: ReturnType<typeof calculateServiceDates> | null
) {
  if (form.serviceType === "DOMAIN_REGISTRATION" && form.domainName.trim()) {
    const expiry = datePreview?.expiryDate ?? new Date(`${form.startDate}T00:00:00.000Z`);
    const r = await fetch(`/api/projects/${serviceProjectId}/services/${serviceId}/domain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domainName: form.domainName.trim(),
        registrar: form.registrar || null,
        purchasedViaMernCrest: form.purchasedViaMernCrest,
        registrationDate: new Date(`${form.startDate}T00:00:00.000Z`).toISOString(),
        expiryDate: new Date(expiry).toISOString(),
        nameservers: form.nameservers
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.error?.message ?? "Failed to create domain record");
  }

  if (form.serviceType === "HOSTING" && form.packageName.trim()) {
    const expiry = datePreview?.expiryDate ?? new Date(`${form.startDate}T00:00:00.000Z`);
    const r = await fetch(`/api/projects/${serviceProjectId}/services/${serviceId}/hosting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageName: form.packageName.trim(),
        diskQuotaMb: Number(form.diskQuotaMb) || 5120,
        bandwidthQuotaMb: Number(form.bandwidthQuotaMb) || 51200,
        serverLocation: form.serverLocation.trim() || null,
        expiryDate: new Date(expiry).toISOString(),
      }),
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.error?.message ?? "Failed to create hosting account");
  }
}
