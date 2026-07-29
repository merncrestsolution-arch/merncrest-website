"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { AlertTriangle, Globe2, Search } from "lucide-react";
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

type DataSource = "all" | "legacy" | "managed";

type LegacyDomainRow = {
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

type ManagedDomainRow = {
  id: string;
  domainName: string;
  effectiveDomainStatus: string;
  expiryDate: string;
  registrar: string | null;
  purchasedViaMernCrest: boolean;
  project: { id: string; name: string; erpProjectId?: string | null };
  client: { id: string; fullName: string; email: string; company: string | null };
};

type UnifiedRow =
  | { kind: "legacy"; data: LegacyDomainRow }
  | { kind: "managed"; data: ManagedDomainRow };

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s.includes("EXPIRING")) return "warning";
  if (s === "EXPIRED" || s === "CANCELLED" || s === "SUSPENDED") return "destructive";
  return "secondary";
}

function managedStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function managedExpiryAlert(expiryDate: string): string {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return "";
  if (days < 0) return "expired";
  if (days <= 7) return "7";
  if (days <= 14) return "14";
  if (days <= 30) return "30";
  return "";
}

function normalizeStatusFilter(value: string): string {
  return value.replace(/ /g, "_").toUpperCase();
}

export function StaffDomainsPanel() {
  const [dataSource, setDataSource] = useState<DataSource>("all");
  const [legacyDomains, setLegacyDomains] = useState<LegacyDomainRow[]>([]);
  const [managedDomains, setManagedDomains] = useState<ManagedDomainRow[]>([]);
  const [alerts, setAlerts] = useState({ within30: 0, within14: 0, within7: 0, expired: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filterManaged = useCallback(
    (rows: ManagedDomainRow[]) => {
      let filtered = rows;
      if (statusFilter) {
        const normalized = normalizeStatusFilter(statusFilter);
        filtered = filtered.filter((row) => row.effectiveDomainStatus === normalized);
      }
      if (expiringOnly) {
        filtered = filtered.filter((row) => row.effectiveDomainStatus === "EXPIRING_SOON");
      }
      return filtered;
    },
    [statusFilter, expiringOnly]
  );

  const load = useCallback(() => {
    setLoading(true);
    setError("");

    const legacyParams = new URLSearchParams();
    if (search) legacyParams.set("q", search);
    if (statusFilter && dataSource === "legacy") legacyParams.set("status", statusFilter);
    if (expiringOnly && dataSource === "legacy") legacyParams.set("expiringOnly", "1");

    const managedParams = new URLSearchParams({ limit: "100" });
    if (search) managedParams.set("q", search);

    const loadLegacy = fetch(`/api/staff/domains?${legacyParams}`).then(async (r) => {
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to load commerce domains");
      return {
        rows: (d.data ?? []) as LegacyDomainRow[],
        alerts: d.meta?.alerts ?? { within30: 0, within14: 0, within7: 0, expired: 0 },
      };
    });

    const loadManaged = fetch(`/api/staff/domains/managed?${managedParams}`).then(async (r) => {
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to load service domains");
      return filterManaged((d.data ?? []) as ManagedDomainRow[]);
    });

    if (dataSource === "legacy") {
      loadLegacy
        .then(({ rows, alerts: nextAlerts }) => {
          setLegacyDomains(rows);
          setAlerts(nextAlerts);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
        .finally(() => setLoading(false));
      return;
    }

    if (dataSource === "managed") {
      loadManaged
        .then((rows) => setManagedDomains(rows))
        .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([loadLegacy, loadManaged])
      .then(([{ rows, alerts: legacyAlerts }, managedRows]) => {
        setLegacyDomains(rows);
        setManagedDomains(managedRows);
        setAlerts(legacyAlerts);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [dataSource, search, statusFilter, expiringOnly, filterManaged]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const filteredLegacy = useMemo(() => {
    if (dataSource === "managed") return [];
    let rows = legacyDomains;
    if (statusFilter && dataSource !== "legacy") {
      rows = rows.filter((row) => row.displayStatus === statusFilter);
    }
    if (expiringOnly && dataSource !== "legacy") {
      rows = rows.filter(
        (row) => row.displayStatus === "Expiring Soon" || ["7", "14", "30"].includes(row.expiryAlert)
      );
    }
    return rows;
  }, [legacyDomains, statusFilter, expiringOnly, dataSource]);

  const filteredManaged = useMemo(() => {
    if (dataSource === "legacy") return [];
    if (dataSource === "managed") return managedDomains;
    return filterManaged(managedDomains);
  }, [managedDomains, dataSource, filterManaged]);

  const unifiedRows = useMemo((): UnifiedRow[] => {
    const rows: UnifiedRow[] = [
      ...filteredLegacy.map((data) => ({ kind: "legacy" as const, data })),
      ...filteredManaged.map((data) => ({ kind: "managed" as const, data })),
    ];
    return rows.sort((a, b) => {
      const aDate = a.kind === "legacy" ? a.data.expiresAt : a.data.expiryDate;
      const bDate = b.kind === "legacy" ? b.data.expiresAt : b.data.expiryDate;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }, [filteredLegacy, filteredManaged]);

  const stats = useMemo(() => {
    const legacyTotal = dataSource === "managed" ? 0 : filteredLegacy.length;
    const managedTotal = dataSource === "legacy" ? 0 : filteredManaged.length;

    const managedExpiring = filteredManaged.filter(
      (d) => d.effectiveDomainStatus === "EXPIRING_SOON" || managedExpiryAlert(d.expiryDate) !== ""
    ).length;
    const managedCritical = filteredManaged.filter((d) => managedExpiryAlert(d.expiryDate) === "7").length;
    const managedExpired = filteredManaged.filter((d) => d.effectiveDomainStatus === "EXPIRED").length;

    if (dataSource === "legacy") {
      return {
        total: legacyTotal,
        expiring: alerts.within30,
        critical: alerts.within7,
        expired: alerts.expired,
      };
    }
    if (dataSource === "managed") {
      return {
        total: managedTotal,
        expiring: managedExpiring,
        critical: managedCritical,
        expired: managedExpired,
      };
    }
    return {
      total: legacyTotal + managedTotal,
      expiring: alerts.within30 + managedExpiring,
      critical: alerts.within7 + managedCritical,
      expired: alerts.expired + managedExpired,
    };
  }, [dataSource, filteredLegacy.length, filteredManaged, alerts]);

  const isEmpty =
    dataSource === "legacy"
      ? filteredLegacy.length === 0
      : dataSource === "managed"
        ? filteredManaged.length === 0
        : unifiedRows.length === 0;

  const showLegacyAlertBanner =
    dataSource !== "managed" && (alerts.within7 > 0 || alerts.expired > 0);

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
        <div className="flex rounded-lg border border-[var(--sp-outline)] p-0.5 text-sm">
          <button
            type="button"
            className={dataSource === "all" ? "stitch-btn-primary-sm !py-1.5" : "stitch-btn-sm !py-1.5"}
            onClick={() => setDataSource("all")}
          >
            All
          </button>
          <button
            type="button"
            className={dataSource === "legacy" ? "stitch-btn-primary-sm !py-1.5" : "stitch-btn-sm !py-1.5"}
            onClick={() => setDataSource("legacy")}
          >
            Commerce
          </button>
          <button
            type="button"
            className={dataSource === "managed" ? "stitch-btn-primary-sm !py-1.5" : "stitch-btn-sm !py-1.5"}
            onClick={() => setDataSource("managed")}
          >
            Service projects
          </button>
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
          <div className="stitch-kpi-value text-red-400">{stats.critical}</div>
          <div className="stitch-kpi-label">Critical ≤7 days</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-value text-red-400">{stats.expired}</div>
          <div className="stitch-kpi-label">Expired</div>
        </div>
      </div>

      {showLegacyAlertBanner && (
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
          {dataSource === "legacy" ? (
            <>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Transferred">Transferred</option>
              <option value="Cancelled">Cancelled</option>
            </>
          ) : (
            <>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring soon</option>
              <option value="EXPIRED">Expired</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="SUSPENDED">Suspended</option>
            </>
          )}
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
      ) : isEmpty ? (
        <EmptyState
          icon={Globe2}
          title="No domains found"
          description="Domains appear here when provisioned or manually added."
        />
      ) : dataSource === "all" ? (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Source</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Registrar</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {unifiedRows.map((row) =>
                  row.kind === "legacy" ? (
                    <tr
                      key={`legacy-${row.data.id}`}
                      className={
                        row.data.expiryAlert === "expired" || row.data.expiryAlert === "7"
                          ? "bg-red-500/5"
                          : row.data.expiryAlert === "14" || row.data.expiryAlert === "30"
                            ? "bg-amber-500/5"
                            : ""
                      }
                    >
                      <td>
                        <Link
                          href={`/staff/domains/${row.data.id}`}
                          className="font-mono text-sm font-medium hover:text-violet-400"
                        >
                          {row.data.fqdn}
                        </Link>
                      </td>
                      <td>
                        <Badge variant="secondary">Commerce</Badge>
                      </td>
                      <td>
                        <Link
                          href={`/staff/clients/${row.data.client.id}`}
                          className="hover:text-violet-400"
                        >
                          {row.data.client.name}
                        </Link>
                      </td>
                      <td>—</td>
                      <td>{row.data.registrar || "—"}</td>
                      <td>{formatSriLankaDate(row.data.expiresAt)}</td>
                      <td>
                        <Badge variant={statusVariant(row.data.displayStatus)}>
                          {row.data.displayStatus}
                        </Badge>
                      </td>
                    </tr>
                  ) : (
                    <tr key={`managed-${row.data.id}`}>
                      <td>
                        <Link
                          href={`/staff/domains/managed/${row.data.id}`}
                          className="font-mono text-sm font-medium hover:text-violet-400"
                        >
                          {row.data.domainName}
                        </Link>
                      </td>
                      <td>
                        <Badge variant="secondary">Service</Badge>
                      </td>
                      <td>
                        <Link
                          href={`/staff/clients/${row.data.client.id}`}
                          className="hover:text-violet-400"
                        >
                          {row.data.client.company || row.data.client.fullName}
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={
                            row.data.project.erpProjectId
                              ? `/staff/projects/${row.data.project.erpProjectId}#services`
                              : `/staff/service-projects/${row.data.project.id}`
                          }
                          className="hover:text-violet-400"
                        >
                          {row.data.project.name}
                        </Link>
                      </td>
                      <td>{row.data.registrar || "—"}</td>
                      <td>{formatSriLankaDate(row.data.expiryDate)}</td>
                      <td>
                        <Badge variant={statusVariant(row.data.effectiveDomainStatus)}>
                          {managedStatusLabel(row.data.effectiveDomainStatus)}
                        </Badge>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : dataSource === "legacy" ? (
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
                {filteredLegacy.map((d) => (
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
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Registrar</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredManaged.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link
                        href={`/staff/domains/managed/${d.id}`}
                        className="font-mono text-sm font-medium hover:text-violet-400"
                      >
                        {d.domainName}
                      </Link>
                      {d.purchasedViaMernCrest ? (
                        <span className="text-xs text-[var(--sp-muted)] block">MernCrest managed</span>
                      ) : null}
                    </td>
                    <td>
                      <Link href={`/staff/clients/${d.client.id}`} className="hover:text-violet-400">
                        {d.client.company || d.client.fullName}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={
                          d.project.erpProjectId
                            ? `/staff/projects/${d.project.erpProjectId}#services`
                            : `/staff/service-projects/${d.project.id}`
                        }
                        className="hover:text-violet-400"
                      >
                        {d.project.name}
                      </Link>
                    </td>
                    <td>{d.registrar || "—"}</td>
                    <td>{formatSriLankaDate(d.expiryDate)}</td>
                    <td>
                      <Badge variant={statusVariant(d.effectiveDomainStatus)}>
                        {managedStatusLabel(d.effectiveDomainStatus)}
                      </Badge>
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
