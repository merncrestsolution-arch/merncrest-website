"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { AlertTriangle, Globe2, Plus, Search } from "lucide-react";
import { formatMoney } from "@/lib/commerce-format";
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

type DomainRow = {
  id: string;
  fqdn: string;
  displayStatus: string;
  expiryAlert: string;
  expiresAt: string | null;
  registeredAt: string | null;
  registrar: string | null;
  registrationCostCents: number;
  isFreeProvided: boolean;
  freeDurationLabel: string | null;
  renewalCostCents: number;
  autoRenew: boolean;
  client: { id: string; name: string; email: string };
};

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "Active") return "success";
  if (status === "Expiring Soon") return "warning";
  if (status === "Expired" || status === "Cancelled") return "destructive";
  return "secondary";
}

export function StaffDomainsPanel() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [alerts, setAlerts] = useState({ within30: 0, within14: 0, within7: 0, expired: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    if (expiringOnly) params.set("expiringOnly", "1");

    fetch(`/api/staff/domains?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setDomains(d.data ?? []);
        setAlerts(d.meta?.alerts ?? { within30: 0, within14: 0, within7: 0, expired: 0 });
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
      total: domains.length,
      expiring: alerts.within30,
      expired: alerts.expired,
    }),
    [domains.length, alerts]
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
            <BreadcrumbPage>Domains</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title">Domain Management</h1>
          <p className="stitch-page-sub !mb-0">
            Full domain lifecycle — registrar, expiry, DNS, and renewal tracking (LKR).
          </p>
        </div>
      </div>

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Total Domains</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-amber-400">{stats.expiring}</div>
          <div className="stitch-kpi-label">Expiring ≤30 days</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-red-400">{alerts.within7}</div>
          <div className="stitch-kpi-label">Critical ≤7 days</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-red-400">{stats.expired}</div>
          <div className="stitch-kpi-label">Expired</div>
        </div>
      </div>

      {(alerts.within7 > 0 || alerts.expired > 0) && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            {alerts.expired} expired · {alerts.within7} expiring within 7 days ·{" "}
            {alerts.within14} within 14 days
          </span>
        </div>
      )}

      <div className="stitch-toolbar mb-4">
        <div className="stitch-search-wrap !max-w-none flex-1">
          <Search className="stitch-search-icon" />
          <input
            type="search"
            placeholder="Search domain, client, registrar…"
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
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Transferred">Transferred</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button
          type="button"
          className={expiringOnly ? "stitch-btn-primary-sm" : "stitch-btn-outline-sm"}
          onClick={() => setExpiringOnly((v) => !v)}
        >
          Expiring only
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : domains.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="No domains found"
          description="Domains appear here when provisioned or manually added."
        />
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Client</th>
                  <th>Registrar</th>
                  <th>Expires</th>
                  <th>Renewal (LKR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr
                    key={d.id}
                    className={
                      d.expiryAlert === "expired" || d.expiryAlert === "7"
                        ? "bg-red-500/5"
                        : d.expiryAlert === "14" || d.expiryAlert === "30"
                          ? "bg-amber-500/5"
                          : ""
                    }
                  >
                    <td>
                      <Link
                        href={`/staff/domains/${d.id}`}
                        className="font-mono text-sm font-medium hover:text-violet-400"
                      >
                        {d.fqdn}
                      </Link>
                      {d.isFreeProvided ? (
                        <span className="text-xs text-[var(--sp-muted)] block">
                          {d.freeDurationLabel || "Free provided"}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <Link href={`/staff/clients/${d.client.id}`} className="hover:text-violet-400">
                        {d.client.name}
                      </Link>
                    </td>
                    <td>{d.registrar || "—"}</td>
                    <td>{formatSriLankaDate(d.expiresAt)}</td>
                    <td>{formatMoney(d.renewalCostCents)}</td>
                    <td>
                      <Badge variant={statusVariant(d.displayStatus)}>{d.displayStatus}</Badge>
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
