"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { calculateServiceDates } from "@/shared/renewal-calculator";
import {
  ServiceAttachForm,
  attachDomainOrHosting,
  buildServicePayload,
  defaultServiceAttachForm,
} from "@/components/staff/service-attach-form";

type ClientOption = { id: string; fullName: string; email: string; company?: string | null };
type ProjectOption = {
  id: string;
  name: string;
  projectCode: string;
  status: string;
  customer?: { id: string };
};

export function CreateServiceWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetProjectId = searchParams.get("erpProjectId") ?? "";

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");
  const [erpProjectId, setErpProjectId] = useState(presetProjectId);
  const [form, setForm] = useState(defaultServiceAttachForm());

  useEffect(() => {
    fetch("/api/staff/clients?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClients(d.data ?? []);
      })
      .catch(() => {});
  }, []);

  const loadProjects = useCallback((cid: string) => {
    if (!cid) {
      setProjects([]);
      return;
    }
    setLoadingProjects(true);
    fetch(`/api/erp/projects?customerId=${encodeURIComponent(cid)}`)
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    setErpProjectId(presetProjectId);
  }, [presetProjectId]);

  useEffect(() => {
    if (!presetProjectId) return;
    fetch(`/api/erp/projects?projectId=${encodeURIComponent(presetProjectId)}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.projects?.[0] as ProjectOption | undefined;
        if (!p) return;
        setProjects([p]);
        if (p.customer?.id) {
          setClientId(p.customer.id);
          loadProjects(p.customer.id);
        }
      })
      .catch(() => {});
  }, [presetProjectId, loadProjects]);

  useEffect(() => {
    if (clientId) loadProjects(clientId);
  }, [clientId, loadProjects]);

  const selectedProject = projects.find((p) => p.id === erpProjectId);

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
    const projectId = erpProjectId;
    if (!projectId) {
      setError("Select a project");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/staff/projects/${projectId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildServicePayload(form)),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");

      const spId = d.data?.serviceProjectId as string | undefined;
      const serviceId = d.data?.id as string | undefined;
      if (spId && serviceId) {
        await attachDomainOrHosting(spId, serviceId, form, datePreview);
      }

      router.push(`/staff/projects/${projectId}#services`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl pb-12">
      <div className="stitch-page-head mb-6">
        <Link href="/staff/projects" className="stitch-btn-sm mb-3 inline-flex">
          ← Back to projects
        </Link>
        <h1 className="stitch-page-title">Add service</h1>
        <p className="stitch-page-sub !mb-0">
          Select the client and project — then complete service, billing, and type-specific details.
        </p>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-section-card mb-6">
        <div className="stitch-section-body space-y-4 text-sm">
          {!presetProjectId ? (
            <>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Client</span>
                <select
                  className="stitch-input w-full"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
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
                  value={erpProjectId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setErpProjectId(id);
                    router.replace(id ? `/staff/services/new?erpProjectId=${id}` : "/staff/services/new");
                  }}
                  required
                  disabled={!clientId || loadingProjects}
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
            </>
          ) : selectedProject ? (
            <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-sm">
              <p className="m-0 font-medium">{selectedProject.name}</p>
              <p className="m-0 text-[var(--sp-muted)] font-mono text-xs">{selectedProject.projectCode}</p>
              <p className="m-0 text-xs mt-1">Status: {selectedProject.status}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Service configuration</h3>
        </div>
        <div className="stitch-section-body">
          <ServiceAttachForm
            form={form}
            onChange={setForm}
            onSubmit={submit}
            busy={busy}
            submitLabel={busy ? "Creating…" : "Create service"}
          />
        </div>
      </div>
    </div>
  );
}
