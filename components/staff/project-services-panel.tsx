"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Globe2, Plus, Server } from "lucide-react";
import type { BillingCycle, ServiceType } from "@prisma/client";
import { formatSriLankaDate } from "@/lib/timezone";
import { getServiceTypeLabel } from "@/shared/service-types";
import { calculateServiceDates, resolveFreePeriodDays } from "@/shared/renewal-calculator";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";
import {
  ServiceAttachForm,
  attachDomainOrHosting,
  buildServicePayload,
  defaultServiceAttachForm,
} from "@/components/staff/service-attach-form";

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
  const [form, setForm] = useState(defaultServiceAttachForm);

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
    const startDate = new Date(`${form.startDate}T00:00:00.000Z`);
    if (Number.isNaN(startDate.getTime())) return null;
    return calculateServiceDates({
      startDate,
      freePeriodDays: resolveFreePeriodDays(form.freePeriodPreset, form.freePeriodCustomDays),
      billingCycle: form.billingCycle,
    });
  }, [form.startDate, form.freePeriodPreset, form.freePeriodCustomDays, form.billingCycle]);

  async function attachService(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const r = await fetch(`/api/staff/projects/${erpProjectId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildServicePayload(form)),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to attach service");

      const spId = d.data?.serviceProjectId as string | undefined;
      const serviceId = d.data?.id as string | undefined;
      if (spId && serviceId) {
        await attachDomainOrHosting(spId, serviceId, form, datePreview);
      }

      setShowForm(false);
      setForm(defaultServiceAttachForm());
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
      onAdd={() => setShowForm((v) => !v)}
      addLabel={showForm ? "Hide form" : "Add service"}
      fullPageHref={`/staff/services/new?erpProjectId=${erpProjectId}`}
    >
      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      {showForm ? (
        <section className="mb-6 rounded-xl border border-violet-500/30 bg-[var(--stitch-surface-low)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h4 className="m-0 font-medium">New service</h4>
            <Link href={`/staff/services/new?erpProjectId=${erpProjectId}`} className="stitch-btn-sm">
              Open full-page form
            </Link>
          </div>
          <ServiceAttachForm
            form={form}
            onChange={setForm}
            onSubmit={attachService}
            busy={busy}
            submitLabel="Add service"
            showCancel
            onCancel={() => {
              setShowForm(false);
              setForm(defaultServiceAttachForm());
            }}
          />
        </section>
      ) : null}

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
    </DashboardCardShell>
  );
}

function DashboardCardShell({
  title,
  description,
  onAdd,
  addLabel,
  fullPageHref,
  children,
}: {
  title: string;
  description: string;
  onAdd: () => void;
  addLabel?: string;
  fullPageHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="stitch-section-card">
      <div className="stitch-section-head">
        <div>
          <h3 className="m-0 text-base">{title}</h3>
          <p className="text-sm text-[var(--sp-muted)] m-0 mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {fullPageHref ? (
            <Link href={fullPageHref} className="stitch-btn-outline-sm">
              Full page
            </Link>
          ) : null}
          <button type="button" className="stitch-btn-primary-sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {addLabel ?? "Add service"}
          </button>
        </div>
      </div>
      <div className="stitch-section-body">{children}</div>
    </section>
  );
}
