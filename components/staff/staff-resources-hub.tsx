"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Globe2, Server, Cloud, Filter, Search } from "lucide-react";
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

type HubRow = {
  id: string;
  type: "domain" | "hosting" | "cloud";
  name: string;
  status: string;
  provider: string | null;
  expiresAt?: string | null;
  sslExpiresAt?: string | null;
  renewsAt?: string | null;
  expiryAlert?: string;
  sslStatus?: string;
  client: {
    id: string;
    name: string;
    email: string;
    hasActiveProject: boolean;
  };
  href: string;
};

type Stats = {
  domains: number;
  hosting: number;
  cloud: number;
  noActiveProject: number;
  expiringSoon: number;
};

function typeIcon(type: HubRow["type"]) {
  if (type === "domain") return Globe2;
  if (type === "hosting") return Server;
  return Cloud;
}

export function StaffResourcesHub() {
  const [rows, setRows] = useState<HubRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("");
  const [provider, setProvider] = useState("");
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [typeTab, setTypeTab] = useState<"all" | "domain" | "hosting" | "cloud">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (provider) params.set("provider", provider);
    if (expiringOnly) params.set("expiringOnly", "1");

    fetch(`/api/staff/resources-hub?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setRows(d.data ?? []);
        setStats(d.meta?.stats ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [filter, provider, expiringOnly]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = useMemo(() => {
    if (typeTab === "all") return rows;
    return rows.filter((r) => r.type === typeTab);
  }, [rows, typeTab]);

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Domain &amp; Hosting Hub</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-5">
        <h1 className="stitch-page-title">Domain &amp; Hosting Hub</h1>
        <p className="stitch-page-sub !mb-0">
          Cross-client domains, hosting, and cloud services — including clients without active projects.
        </p>
      </div>

      {stats ? (
        <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-5 mb-5">
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-value">{stats.domains}</div>
            <div className="stitch-kpi-label">Domains</div>
          </div>
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-value">{stats.hosting}</div>
            <div className="stitch-kpi-label">Hosting</div>
          </div>
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-value">{stats.cloud}</div>
            <div className="stitch-kpi-label">Cloud / subs</div>
          </div>
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-value">{stats.noActiveProject}</div>
            <div className="stitch-kpi-label">No active project</div>
          </div>
          <div className="stitch-kpi-card">
            <div className="stitch-kpi-value">{stats.expiringSoon}</div>
            <div className="stitch-kpi-label">Expiring soon</div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="stitch-search-wrap flex-1 min-w-[200px]">
          <Search className="h-4 w-4" />
          <input
            className="stitch-search-input"
            placeholder="Filter by provider…"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>
        <select
          className="stitch-input !w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All clients</option>
          <option value="no_active_project">No active project only</option>
        </select>
        <button
          type="button"
          className={expiringOnly ? "stitch-btn-primary-sm" : "stitch-btn-outline-sm"}
          onClick={() => setExpiringOnly((v) => !v)}
        >
          <Filter className="h-3.5 w-3.5" />
          Expiring 30d
        </button>
      </div>

      <div className="stitch-tab-row mb-4">
        {(["all", "domain", "hosting", "cloud"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={typeTab === t ? "active" : ""}
            onClick={() => setTypeTab(t)}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="No services found"
          description="Adjust filters or add domains/hosting for clients."
        />
      ) : (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Service</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Renewal / expiry</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const Icon = typeIcon(row.type);
                  const expiry =
                    row.expiresAt || row.sslExpiresAt || row.renewsAt;
                  return (
                    <tr key={`${row.type}-${row.id}`}>
                      <td>
                        <Icon className="h-4 w-4 text-[var(--sp-muted)]" />
                      </td>
                      <td>
                        <Link href={row.href} className="font-medium text-violet-400">
                          {row.name}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/staff/clients/${row.client.id}`} className="text-sm">
                          {row.client.name}
                        </Link>
                        {!row.client.hasActiveProject ? (
                          <Badge variant="warning" className="ml-1 text-[10px]">No project</Badge>
                        ) : null}
                      </td>
                      <td>
                        <span className="stitch-chip text-[10px]">{row.status}</span>
                        {row.sslStatus ? (
                          <span className="stitch-chip text-[10px] ml-1">{row.sslStatus}</span>
                        ) : null}
                      </td>
                      <td className="text-sm text-[var(--sp-muted)]">{row.provider || "—"}</td>
                      <td className="text-sm">
                        {expiry ? formatSriLankaDate(expiry) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
