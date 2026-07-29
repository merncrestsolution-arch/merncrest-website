"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import type { BillingCycle, ServiceType } from "@prisma/client";
import { calculateServiceDates, FREE_PERIOD_PRESETS } from "@/shared/renewal-calculator";
import { getServiceTypeLabel } from "@/shared/service-types";
import { formatSriLankaDate } from "@/lib/timezone";

type ClientOption = { id: string; fullName: string; email: string; company?: string | null };
type ProjectOption = { id: string; name: string; projectCode: string; status: string };

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

export function CreateServiceWizard() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientId: "",
    erpProjectId: "",
    serviceType: "DOMAIN_REGISTRATION" as ServiceType,
    startDate: new Date().toISOString().slice(0, 10),
    billingCycle: "ANNUAL" as BillingCycle,
    freePeriodPreset: "0",
    serviceCostLkr: "",
    renewalCostLkr: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/staff/clients?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClients(d.data ?? []);
      })
      .catch(() => {});
  }, []);

  const loadProjects = useCallback((clientId: string) => {
    if (!clientId) {
      setProjects([]);
      return;
    }
    setLoadingProjects(true);
    fetch(`/api/erp/projects?customerId=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    loadProjects(form.clientId);
    setForm((f) => ({ ...f, erpProjectId: "" }));
  }, [form.clientId, loadProjects]);

  const selectedProject = projects.find((p) => p.id === form.erpProjectId);

  const datePreview = useMemo(() => {
    const startDate = new Date(`${form.startDate}T00:00:00.000Z`);
    if (Number.isNaN(startDate.getTime())) return null;
    return calculateServiceDates({
      startDate,
      freePeriodDays: Number(form.freePeriodPreset) || 0,
      billingCycle: form.billingCycle,
    });
  }, [form.startDate, form.freePeriodPreset, form.billingCycle]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.erpProjectId) {
      setError("Select a project");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const metadata: Record<string, unknown> = {};
      if (form.serviceCostLkr) metadata.serviceCostCents = Math.round(Number(form.serviceCostLkr) * 100);
      if (form.renewalCostLkr) metadata.renewalCostCents = Math.round(Number(form.renewalCostLkr) * 100);
      if (form.notes.trim()) metadata.notes = form.notes.trim();

      const r = await fetch(`/api/staff/projects/${form.erpProjectId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: form.serviceType,
          startDate: new Date(`${form.startDate}T00:00:00.000Z`).toISOString(),
          billingCycle: form.billingCycle,
          freePeriodDays: Number(form.freePeriodPreset) || 0,
          metadata: Object.keys(metadata).length ? metadata : undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      router.push(`/staff/projects/${form.erpProjectId}#services`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="stitch-page-head mb-6">
        <h1 className="stitch-page-title">Add service</h1>
        <p className="stitch-page-sub !mb-0">
          Select the client and project — project details auto-fill. Complete only the service information.
        </p>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <form onSubmit={submit} className="stitch-section-card">
        <div className="stitch-section-body space-y-4 text-sm">
          <label className="block space-y-1">
            <span className="text-[var(--sp-muted)]">Client</span>
            <select
              className="stitch-input w-full"
              value={form.clientId}
              onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
              required
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company || c.fullName} ({c.email})
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-[var(--sp-muted)]">Project</span>
            <select
              className="stitch-input w-full"
              value={form.erpProjectId}
              onChange={(e) => setForm((f) => ({ ...f, erpProjectId: e.target.value }))}
              required
              disabled={!form.clientId || loadingProjects}
            >
              <option value="">
                {loadingProjects ? "Loading projects…" : "Select project…"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          </label>

          {selectedProject ? (
            <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-sm">
              <p className="m-0 font-medium">{selectedProject.name}</p>
              <p className="m-0 text-[var(--sp-muted)] font-mono text-xs">{selectedProject.projectCode}</p>
              <p className="m-0 text-xs mt-1">Status: {selectedProject.status}</p>
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-[var(--sp-muted)]">Service type</span>
            <select
              className="stitch-input w-full"
              value={form.serviceType}
              onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value as ServiceType }))}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {getServiceTypeLabel(t)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
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
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual (12 months)</option>
                <option value="ONE_TIME">One time</option>
              </select>
            </label>
          </div>

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
            <div className="rounded-lg bg-[var(--stitch-surface-low)] border border-[var(--sp-outline)] p-3 text-xs space-y-1">
              <p className="m-0">
                <strong>Next billing:</strong> {formatSriLankaDate(datePreview.nextBillingDate)}
              </p>
              <p className="m-0">
                <strong>Renewal:</strong> {formatSriLankaDate(datePreview.renewalDate)}
              </p>
              <p className="m-0">
                <strong>Expiry:</strong> {formatSriLankaDate(datePreview.expiryDate)}
              </p>
            </div>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-3">
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
          </div>

          <label className="block space-y-1">
            <span className="text-[var(--sp-muted)]">Notes</span>
            <textarea
              className="stitch-input w-full min-h-[72px]"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>

          <button type="submit" className="stitch-btn-primary" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create service"}
          </button>
        </div>
      </form>
    </div>
  );
}
