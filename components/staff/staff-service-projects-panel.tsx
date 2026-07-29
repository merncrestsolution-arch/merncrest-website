"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { FolderKanban, Plus, Search } from "lucide-react";
import { formatSriLankaDate } from "@/lib/timezone";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";

type ServiceProjectRow = {
  id: string;
  clientId: string;
  name: string;
  status: string;
  erpProjectId: string | null;
  serviceCount: number;
  client: {
    id: string;
    fullName: string;
    email: string;
    company: string | null;
  };
  erpProject: { id: string; name: string; projectCode: string } | null;
  createdAt: string;
};

type ClientOption = {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
};

function statusChip(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "stitch-chip stitch-badge-done";
  if (s === "ON_HOLD") return "stitch-chip stitch-badge-pending";
  if (s === "CANCELLED") return "stitch-chip stitch-badge-danger";
  if (s === "COMPLETED") return "stitch-chip stitch-badge-progress";
  return "stitch-chip";
}

export function StaffServiceProjectsPanel() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ServiceProjectRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    erpProjectId: "",
    status: "ACTIVE",
  });

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch("/api/staff/service-projects?limit=100")
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setProjects(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const erpProjectId = searchParams.get("erpProjectId");
    const name = searchParams.get("name");
    if (erpProjectId || name) {
      setShowModal(true);
      setForm((f) => ({
        ...f,
        erpProjectId: erpProjectId || f.erpProjectId,
        name: name || f.name,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showModal) return;
    fetch("/api/admin/customers?limit=200")
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) setClients(d.customers ?? []);
      })
      .catch(() => {});
  }, [showModal]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.client.fullName.toLowerCase().includes(q) ||
        p.client.email.toLowerCase().includes(q) ||
        (p.client.company?.toLowerCase().includes(q) ?? false) ||
        (p.erpProject?.projectCode.toLowerCase().includes(q) ?? false)
      );
    });
  }, [projects, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) => p.status === "ACTIVE").length,
      services: projects.reduce((s, p) => s + p.serviceCount, 0),
      linked: projects.filter((p) => p.erpProjectId).length,
    }),
    [projects]
  );

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/staff/service-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          name: form.name,
          status: form.status,
          erpProjectId: form.erpProjectId || null,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to create");

      setShowModal(false);
      setForm({ clientId: "", name: "", erpProjectId: "", status: "ACTIVE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Service Projects</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title">Service Projects</h1>
          <p className="stitch-page-sub !mb-0">
            Client service bundles — domains, hosting, SSL, and renewals linked to delivery projects.
          </p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Total projects</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-emerald-500">{stats.active}</div>
          <div className="stitch-kpi-label">Active</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-violet-400">{stats.services}</div>
          <div className="stitch-kpi-label">Attached services</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{stats.linked}</div>
          <div className="stitch-kpi-label">ERP linked</div>
        </div>
      </div>

      <div className="stitch-toolbar mb-4">
        <div className="stitch-search-wrap !max-w-none flex-1">
          <Search className="stitch-search-icon" />
          <input
            type="search"
            placeholder="Search project, client, ERP code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="stitch-input !w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : error && projects.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No service projects"
          description="Create a service project to attach domains, hosting, and other services."
        />
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>ERP link</th>
                  <th>Services</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/staff/service-projects/${p.id}`}
                        className="font-medium hover:text-violet-400"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/staff/clients/${p.client.id}`} className="hover:text-violet-400">
                        {p.client.company || p.client.fullName}
                      </Link>
                      <span className="text-xs text-[var(--sp-muted)] block">{p.client.email}</span>
                    </td>
                    <td>
                      {p.erpProject ? (
                        <Link
                          href={`/staff/projects/${p.erpProject.id}`}
                          className="font-mono text-xs hover:text-violet-400"
                        >
                          {p.erpProject.projectCode}
                        </Link>
                      ) : (
                        <span className="text-[var(--sp-muted)]">—</span>
                      )}
                    </td>
                    <td>{p.serviceCount}</td>
                    <td>
                      <span className={statusChip(p.status)}>{p.status.replace("_", " ")}</span>
                    </td>
                    <td>{formatSriLankaDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showModal ? (
        <div className="stitch-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="stitch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stitch-modal-head">
              <h3>Create service project</h3>
              <button type="button" className="stitch-btn-sm" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <form onSubmit={createProject} className="stitch-modal-body space-y-4 text-sm">
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
                <span className="text-[var(--sp-muted)]">Project name</span>
                <input
                  className="stitch-input w-full"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  maxLength={200}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">ERP project ID (optional)</span>
                <input
                  className="stitch-input w-full font-mono text-xs"
                  value={form.erpProjectId}
                  onChange={(e) => setForm((f) => ({ ...f, erpProjectId: e.target.value }))}
                  placeholder="Link to delivery project"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[var(--sp-muted)]">Status</span>
                <select
                  className="stitch-input w-full"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              {error ? <p className="stitch-auth-error !mb-0">{error}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="stitch-btn-outline-sm" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
