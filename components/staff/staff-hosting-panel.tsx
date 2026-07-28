"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { AlertTriangle, Search, Server } from "lucide-react";
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

type HostingRow = {
  id: string;
  label: string;
  planCode: string;
  status: string;
  sslStatus: string;
  sslExpiresAt: string | null;
  renewsAt: string | null;
  provider: string | null;
  linkedDomains: string[];
  client: { id: string; name: string; email: string };
};

function sslVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "Active") return "success";
  if (status === "Expiring Soon") return "warning";
  if (status === "Expired" || status === "Not Configured") return "destructive";
  return "secondary";
}

export function StaffHostingPanel() {
  const [accounts, setAccounts] = useState<HostingRow[]>([]);
  const [search, setSearch] = useState("");
  const [sslIssuesOnly, setSslIssuesOnly] = useState(false);
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (sslIssuesOnly) params.set("sslIssues", "1");
    if (expiringOnly) params.set("expiringOnly", "1");

    fetch(`/api/staff/hosting?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setAccounts(d.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [search, sslIssuesOnly, expiringOnly]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(
    () => ({
      total: accounts.length,
      sslIssues: accounts.filter((a) => a.sslStatus !== "Active").length,
      expiring: accounts.filter((a) => {
        if (!a.renewsAt) return false;
        return new Date(a.renewsAt).getTime() <= Date.now() + 30 * 86400000;
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
          Hosting accounts, credentials (encrypted), SSL, and linked domains.
        </p>
      </div>

      <div className="stitch-kpi-grid !grid-cols-3 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Accounts</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-amber-400">{stats.sslIssues}</div>
          <div className="stitch-kpi-label">SSL alerts</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-amber-400">{stats.expiring}</div>
          <div className="stitch-kpi-label">Renewing ≤30 days</div>
        </div>
      </div>

      {stats.sslIssues > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{stats.sslIssues} account(s) with SSL issues or expiring certificates</span>
        </div>
      )}

      <div className="stitch-toolbar mb-4">
        <div className="stitch-search-wrap !max-w-none flex-1">
          <Search className="stitch-search-icon" />
          <input
            type="search"
            placeholder="Search label, domain, client, IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={sslIssuesOnly ? "stitch-btn-primary-sm" : "stitch-btn-outline-sm"}
          onClick={() => setSslIssuesOnly((v) => !v)}
        >
          SSL issues
        </button>
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
                  <th>Account</th>
                  <th>Client</th>
                  <th>Provider</th>
                  <th>Domains</th>
                  <th>SSL</th>
                  <th>Renews</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        href={`/staff/hosting/${a.id}`}
                        className="font-medium hover:text-violet-400"
                      >
                        {a.label}
                      </Link>
                      <span className="text-xs text-[var(--sp-muted)] block">{a.planCode}</span>
                    </td>
                    <td>
                      <Link href={`/staff/clients/${a.client.id}`} className="hover:text-violet-400">
                        {a.client.name}
                      </Link>
                    </td>
                    <td>{a.provider || "—"}</td>
                    <td className="text-xs max-w-[140px] truncate">
                      {a.linkedDomains.join(", ") || "—"}
                    </td>
                    <td>
                      <Badge variant={sslVariant(a.sslStatus)}>{a.sslStatus}</Badge>
                    </td>
                    <td>{formatSriLankaDate(a.renewsAt)}</td>
                    <td>{a.status}</td>
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
