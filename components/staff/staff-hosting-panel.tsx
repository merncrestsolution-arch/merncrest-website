"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Search, Server } from "lucide-react";
import { formatSriLankaDate } from "@/lib/timezone";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";

type ManagedHostingRow = {
  id: string;
  packageName: string;
  hostingStatus: string;
  serverLocation: string | null;
  expiryDate: string | null;
  renewalDate: string | null;
  usage: {
    disk: { usedMb: number; quotaMb: number; percentage: number };
    bandwidth: { usedMb: number; quotaMb: number; percentage: number };
  };
  project: { id: string; name: string };
  client: { id: string; fullName: string; email: string; company: string | null };
};

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s === "SUSPENDED") return "warning";
  if (s === "EXPIRED" || s === "CANCELLED") return "destructive";
  return "secondary";
}

export function StaffHostingPanel() {
  const [accounts, setAccounts] = useState<ManagedHostingRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.set("q", search);

    fetch(`/api/staff/hosting/managed?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        let rows = (d.data ?? []) as ManagedHostingRow[];
        if (statusFilter) {
          rows = rows.filter((a) => a.hostingStatus === statusFilter);
        }
        if (expiringOnly) {
          const cutoff = Date.now() + 30 * 86400000;
          rows = rows.filter((a) => {
            if (!a.expiryDate) return false;
            return new Date(a.expiryDate).getTime() <= cutoff;
          });
        }
        setAccounts(rows);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [search, statusFilter, expiringOnly]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(
    () => ({
      total: accounts.length,
      highDisk: accounts.filter((a) => a.usage.disk.percentage >= 80).length,
      expiring: accounts.filter((a) => {
        if (!a.expiryDate) return false;
        return new Date(a.expiryDate).getTime() <= Date.now() + 30 * 86400000;
      }).length,
    }),
    [accounts]
  );

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Hosting</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-5">
        <h1 className="stitch-page-title">Hosting Management</h1>
        <p className="stitch-page-sub !mb-0">
          Service-project hosting accounts — packages, usage, and renewal tracking.
        </p>
      </div>

      <div className="stitch-kpi-grid !grid-cols-3 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Accounts</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-amber-400">{stats.highDisk}</div>
          <div className="stitch-kpi-label">High disk usage</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-amber-400">{stats.expiring}</div>
          <div className="stitch-kpi-label">Renewing ≤30 days</div>
        </div>
      </div>

      <div className="stitch-toolbar mb-4">
        <div className="stitch-search-wrap !max-w-none flex-1">
          <Search className="stitch-search-icon" />
          <input
            type="search"
            placeholder="Search package, client, project…"
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
          <option value="SUSPENDED">Suspended</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="button"
          className={expiringOnly ? "stitch-btn-primary-sm" : "stitch-btn-outline-sm"}
          onClick={() => setExpiringOnly((v) => !v)}
        >
          Expiring
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : accounts.length === 0 ? (
        <EmptyState icon={Server} title="No hosting accounts" />
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Disk</th>
                  <th>Location</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        href={`/staff/hosting/managed/${a.id}`}
                        className="font-medium hover:text-violet-400"
                      >
                        {a.packageName}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/staff/clients/${a.client.id}`} className="hover:text-violet-400">
                        {a.client.company || a.client.fullName}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/staff/service-projects/${a.project.id}`}
                        className="hover:text-violet-400"
                      >
                        {a.project.name}
                      </Link>
                    </td>
                    <td>
                      <span className="text-xs">
                        {a.usage.disk.percentage}% ({a.usage.disk.usedMb} MB)
                      </span>
                    </td>
                    <td>{a.serverLocation || "—"}</td>
                    <td>{formatSriLankaDate(a.expiryDate)}</td>
                    <td>
                      <Badge variant={statusVariant(a.hostingStatus)}>{a.hostingStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
