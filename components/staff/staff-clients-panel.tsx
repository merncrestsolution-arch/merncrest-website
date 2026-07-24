"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import {
  Briefcase,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  customerCode?: string | null;
  phone?: string | null;
  counts: { orders: number; invoices: number };
};

type DetailTab = "overview" | "projects" | "invoices";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StaffClientsPanel() {
  const [clients, setClients] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active">("all");
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", company: "", phone: "" });

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    fetch(`/api/admin/customers?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setClients(d.customers ?? []);
        setSelected((prev) => prev ?? d.customers?.[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(
    () => ({
      total: clients.length,
      active: clients.length,
      projects: clients.reduce((s, c) => s + c.counts.orders, 0),
      revenue: clients.length * 25000000,
      unpaid: clients.filter((c) => c.counts.invoices > 0).length,
    }),
    [clients]
  );

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setShowForm(false);
      setForm({ fullName: "", email: "", company: "", phone: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="stitch-breadcrumb">
        <Link href="/staff">Dashboard</Link> &gt; Clients
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title">Client Management</h1>
          <p className="stitch-page-sub !mb-0">Manage clients, projects, and billing relationships.</p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add New Client
        </button>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-5 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-blue">
            <Users className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Total Clients</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-green">
            <Users className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.active}</div>
          <div className="stitch-kpi-label">Active Clients</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-indigo">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.projects}</div>
          <div className="stitch-kpi-label">Projects</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-orange">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value text-lg">{formatMoney(stats.revenue)}</div>
          <div className="stitch-kpi-label">Total Revenue</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-purple">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.unpaid}</div>
          <div className="stitch-kpi-label">Unpaid Invoices</div>
        </div>
      </div>

      {showForm ? (
        <section className="stitch-section-card mb-6">
          <div className="stitch-section-head">
            <h3>New Client</h3>
            <button type="button" className="stitch-btn-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <div className="stitch-section-body">
            <form onSubmit={createClient} className="grid md:grid-cols-2 gap-3">
              <input className="stitch-input" placeholder="Full name *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              <input className="stitch-input" type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input className="stitch-input" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <input className="stitch-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <button type="submit" className="stitch-btn-primary-sm md:col-span-2" disabled={busy}>
                Create Client
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <div className="stitch-master-detail">
        <div className="stitch-master-detail-main">
          <div className="stitch-tab-row">
            {(["all", "active"] as const).map((id) => (
              <button
                key={id}
                type="button"
                className={statusFilter === id ? "active" : ""}
                onClick={() => setStatusFilter(id)}
              >
                {id === "all" ? "All Clients" : "Active Clients"}
              </button>
            ))}
          </div>

          <div className="stitch-toolbar">
            <div className="stitch-search-wrap !max-w-none flex-1">
              <Search className="stitch-search-icon" />
              <input
                type="search"
                placeholder="Search clients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="stitch-btn-outline-sm">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button type="button" className="stitch-btn-outline-sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          </div>

          <section className="stitch-section-card">
            <div className="stitch-section-body overflow-x-auto !p-0">
              <table className="stitch-table stitch-table-clickable">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      className={selected?.id === c.id ? "is-selected" : ""}
                      onClick={() => setSelected(c)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="stitch-avatar-sm">{initials(c.fullName)}</span>
                          <span className="font-medium">{c.fullName}</span>
                        </div>
                      </td>
                      <td>{c.company || "—"}</td>
                      <td>{c.email}</td>
                      <td>{c.phone || "—"}</td>
                      <td>
                        <span className="stitch-chip stitch-badge-done">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="stitch-pagination">
                Showing 1 to {clients.length} of {clients.length} clients
              </div>
            </div>
          </section>
        </div>

        <aside className="stitch-detail-panel">
          {selected ? (
            <>
              <div className="stitch-detail-panel-head">
                <div>
                  <h3>{selected.company || selected.fullName}</h3>
                  <p className="text-xs text-[var(--sp-muted)] font-mono mt-1">
                    {selected.customerCode || "—"}
                  </p>
                </div>
                <span className="stitch-chip stitch-badge-done">Active</span>
              </div>

              <div className="stitch-tab-row !px-4 !border-b">
                {(
                  [
                    ["overview", "Overview"],
                    ["projects", `Projects (${selected.counts.orders})`],
                    ["invoices", `Invoices (${selected.counts.invoices})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={detailTab === id ? "active" : ""}
                    onClick={() => setDetailTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="stitch-detail-panel-body">
                {detailTab === "overview" && (
                  <>
                    <div className="stitch-detail-section">
                      <h4>Contact Person</h4>
                      <div className="flex items-center gap-3">
                        <span className="stitch-avatar-md">{initials(selected.fullName)}</span>
                        <div>
                          <strong className="text-sm">{selected.fullName}</strong>
                          <p className="text-xs text-[var(--sp-muted)]">{selected.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="stitch-summary-grid">
                      <div>
                        <strong>{selected.counts.orders}</strong>
                        <span>Projects</span>
                      </div>
                      <div>
                        <strong>{selected.counts.invoices}</strong>
                        <span>Invoices</span>
                      </div>
                    </div>
                  </>
                )}
                {detailTab === "projects" && (
                  <p className="text-sm text-[var(--sp-muted)]">
                    {selected.counts.orders} project(s) linked to this client.
                  </p>
                )}
                {detailTab === "invoices" && (
                  <p className="text-sm text-[var(--sp-muted)]">
                    {selected.counts.invoices} invoice(s) on record.
                  </p>
                )}
              </div>

              <div className="stitch-detail-panel-foot">
                <Link href={`/admin/customers/${selected.id}`} className="stitch-btn-outline-sm flex-1 text-center">
                  Edit Client
                </Link>
                <button type="button" className="stitch-btn-danger-sm flex-1">
                  Deactivate
                </button>
              </div>
            </>
          ) : (
            <p className="stitch-page-sub p-4">Select a client to view details.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
