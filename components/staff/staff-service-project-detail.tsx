"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatSriLankaDate } from "@/lib/timezone";
import { ProjectServicesPanel } from "@/components/staff/project-services-panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";

type ServiceProjectDetail = {
  id: string;
  name: string;
  status: string;
  clientId: string;
  erpProjectId: string | null;
  client: {
    id: string;
    fullName: string;
    email: string;
    company: string | null;
  };
  erpProject: { id: string; name: string; projectCode: string; status: string } | null;
  createdAt: string;
};

function statusChip(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "stitch-chip stitch-badge-done";
  if (s === "ON_HOLD") return "stitch-chip stitch-badge-pending";
  if (s === "CANCELLED") return "stitch-chip stitch-badge-danger";
  return "stitch-chip stitch-chip-violet";
}

export function StaffServiceProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setup = searchParams.get("setup");
  const serviceId = searchParams.get("serviceId");

  const [project, setProject] = useState<ServiceProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [domainForm, setDomainForm] = useState({
    domainName: "",
    registrar: "",
    registrationDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    purchasedViaMernCrest: true,
  });
  const [hostingForm, setHostingForm] = useState({
    packageName: "",
    diskQuotaMb: "5120",
    bandwidthQuotaMb: "51200",
    serverLocation: "",
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/staff/service-projects/${projectId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setProject(d.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function setupDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/projects/${projectId}/services/${serviceId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domainForm.domainName,
          registrar: domainForm.registrar || null,
          purchasedViaMernCrest: domainForm.purchasedViaMernCrest,
          registrationDate: new Date(`${domainForm.registrationDate}T00:00:00.000Z`).toISOString(),
          expiryDate: new Date(`${domainForm.expiryDate}T00:00:00.000Z`).toISOString(),
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to create domain");

      router.push(`/staff/domains/managed/${d.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setupHosting(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/projects/${projectId}/services/${serviceId}/hosting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: hostingForm.packageName,
          diskQuotaMb: Number(hostingForm.diskQuotaMb),
          bandwidthQuotaMb: Number(hostingForm.bandwidthQuotaMb),
          serverLocation: hostingForm.serverLocation || null,
          expiryDate: new Date(`${hostingForm.expiryDate}T00:00:00.000Z`).toISOString(),
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to create hosting");

      router.push(`/staff/hosting/managed/${d.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && !project) return <ErrorState message={error} onRetry={load} />;
  if (!project) return <ErrorState message="Project not found" onRetry={load} />;

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff/service-projects">Service Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="stitch-page-title !mb-0">{project.name}</h1>
            <span className={statusChip(project.status)}>{project.status.replace("_", " ")}</span>
          </div>
          <p className="text-sm text-[var(--sp-muted)]">
            {project.client.company || project.client.fullName} · {project.client.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.erpProject ? (
            <Link href={`/staff/projects/${project.erpProject.id}`} className="stitch-btn-primary-sm">
              Full project hub
            </Link>
          ) : null}
          <Link href="/staff/service-projects" className="stitch-btn-outline-sm">
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Link>
        </div>
      </div>

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-3 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-base">
            {project.erpProject ? (
              <Link href={`/staff/projects/${project.erpProject.id}`} className="hover:text-violet-400">
                {project.erpProject.projectCode}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div className="stitch-kpi-label">ERP project</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-base">{formatSriLankaDate(project.createdAt)}</div>
          <div className="stitch-kpi-label">Created</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-base">
            <Link href={`/staff/clients/${project.client.id}`} className="hover:text-violet-400">
              View client
            </Link>
          </div>
          <div className="stitch-kpi-label">Customer</div>
        </div>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      {project.erpProjectId ? (
        <ProjectServicesPanel erpProjectId={project.erpProjectId} onChanged={load} />
      ) : null}

      {setup === "domain" && serviceId ? (
        <div className="stitch-modal-backdrop">
          <div className="stitch-modal">
            <div className="stitch-modal-head">
              <h3>Setup domain</h3>
              <Link href={`/staff/service-projects/${projectId}`} className="stitch-btn-sm">
                Cancel
              </Link>
            </div>
            <form onSubmit={setupDomain} className="stitch-modal-body space-y-4 text-sm">
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Domain name</span>
                <input
                  className="stitch-input w-full font-mono"
                  value={domainForm.domainName}
                  onChange={(e) => setDomainForm((f) => ({ ...f, domainName: e.target.value }))}
                  placeholder="example.lk"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Registrar</span>
                <input
                  className="stitch-input w-full"
                  value={domainForm.registrar}
                  onChange={(e) => setDomainForm((f) => ({ ...f, registrar: e.target.value }))}
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[var(--sp-muted)]">Registration date</span>
                  <input
                    type="date"
                    className="stitch-input w-full"
                    value={domainForm.registrationDate}
                    onChange={(e) =>
                      setDomainForm((f) => ({ ...f, registrationDate: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[var(--sp-muted)]">Expiry date</span>
                  <input
                    type="date"
                    className="stitch-input w-full"
                    value={domainForm.expiryDate}
                    onChange={(e) => setDomainForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={domainForm.purchasedViaMernCrest}
                  onChange={(e) =>
                    setDomainForm((f) => ({ ...f, purchasedViaMernCrest: e.target.checked }))
                  }
                />
                <span>Purchased via MernCrest (full lifecycle management)</span>
              </label>
              <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create domain"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {setup === "hosting" && serviceId ? (
        <div className="stitch-modal-backdrop">
          <div className="stitch-modal">
            <div className="stitch-modal-head">
              <h3>Setup hosting</h3>
              <Link href={`/staff/service-projects/${projectId}`} className="stitch-btn-sm">
                Cancel
              </Link>
            </div>
            <form onSubmit={setupHosting} className="stitch-modal-body space-y-4 text-sm">
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Package name</span>
                <input
                  className="stitch-input w-full"
                  value={hostingForm.packageName}
                  onChange={(e) => setHostingForm((f) => ({ ...f, packageName: e.target.value }))}
                  required
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[var(--sp-muted)]">Disk quota (MB)</span>
                  <input
                    type="number"
                    min={1}
                    className="stitch-input w-full"
                    value={hostingForm.diskQuotaMb}
                    onChange={(e) => setHostingForm((f) => ({ ...f, diskQuotaMb: e.target.value }))}
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[var(--sp-muted)]">Bandwidth quota (MB)</span>
                  <input
                    type="number"
                    min={1}
                    className="stitch-input w-full"
                    value={hostingForm.bandwidthQuotaMb}
                    onChange={(e) =>
                      setHostingForm((f) => ({ ...f, bandwidthQuotaMb: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Server location</span>
                <input
                  className="stitch-input w-full"
                  value={hostingForm.serverLocation}
                  onChange={(e) => setHostingForm((f) => ({ ...f, serverLocation: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Expiry date</span>
                <input
                  type="date"
                  className="stitch-input w-full"
                  value={hostingForm.expiryDate}
                  onChange={(e) => setHostingForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  required
                />
              </label>
              <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create hosting"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
