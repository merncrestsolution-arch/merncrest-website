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

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  customerCode?: string | null;
  phone?: string | null;
  counts: {
    orders: number;
    invoices: number;
    domains: number;
    hostingAccounts: number;
  };
  billing: {
    invoicedCents: number;
    paidCents: number;
    balanceCents: number;
    invoiceCount: number;
  };
};

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", company: "", phone: "" });

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    fetch(`/api/staff/clients?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message || d.error || "Failed to load clients");
        const rows = Array.isArray(d.data) ? d.data : d.customers ?? [];
        setClients(rows);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(
    () => ({
      total: clients.length,
      projects: clients.reduce((s, c) => s + c.counts.orders, 0),
      revenue: clients.reduce((s, c) => s + c.billing.paidCents, 0),
      unpaid: clients.filter((c) => c.billing.balanceCents > 0).length,
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
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Clients</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title">Client Management</h1>
          <p className="stitch-page-sub !mb-0">
            Manage clients, projects, services, and billing relationships.
          </p>
        </div>
        <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add New Client
        </button>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-blue">
            <Users className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Total Clients</div>
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
          <div className="stitch-kpi-label">Total Revenue (LKR)</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-purple">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.unpaid}</div>
          <div className="stitch-kpi-label">Clients with Balance</div>
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
              <input
                className="stitch-input"
                placeholder="Full name *"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
              <input
                className="stitch-input"
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className="stitch-input"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <input
                className="stitch-input"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <button type="submit" className="stitch-btn-primary-sm md:col-span-2" disabled={busy}>
                Create Client
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <div className="stitch-toolbar mb-4">
        <div className="stitch-search-wrap !max-w-none flex-1">
          <Search className="stitch-search-icon" />
          <input
            type="search"
            placeholder="Search clients by name, email, company, or code…"
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

      {loading ? (
        <LoadingState />
      ) : error && clients.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={search ? "Try a different search term." : "Add your first client to get started."}
          action={
            !search ? (
              <button type="button" className="stitch-btn-primary-sm" onClick={() => setShowForm(true)}>
                Add Client
              </button>
            ) : undefined
          }
        />
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table stitch-table-clickable">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Projects</th>
                  <th>Balance (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/staff/clients/${c.id}`}
                        className="flex items-center gap-2 hover:text-violet-400"
                      >
                        <span className="stitch-avatar-sm">{initials(c.fullName)}</span>
                        <span>
                          <span className="font-medium block">{c.fullName}</span>
                          {c.customerCode ? (
                            <span className="text-xs text-[var(--sp-muted)] font-mono">
                              {c.customerCode}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td>{c.company || "—"}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.counts.orders}</td>
                    <td>{formatMoney(c.billing.balanceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="stitch-pagination">
              Showing {clients.length} client{clients.length !== 1 ? "s" : ""}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
