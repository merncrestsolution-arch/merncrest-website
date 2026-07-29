"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { formatSriLankaDate, formatSriLankaDateTime } from "@/lib/timezone";
import { DOMAIN_REGISTRARS, registrarLabel } from "@/shared/domain-registrars";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";
import type { DnsRecord } from "@/shared/service-types";
import type { LiveDnsSnapshot } from "@/lib/dns/live-dns-lookup";

type HistoryEntry = {
  id: string;
  action: string;
  createdAt: string;
  createdBy: string;
  detail?: unknown;
};

type ManagedDomain = {
  id: string;
  projectServiceId: string;
  domainName: string;
  domainExtension?: string | null;
  registrar: string | null;
  purchasedViaMernCrest: boolean;
  registrationDate: string;
  expiryDate: string;
  renewalDate?: string | null;
  registrationPeriodMonths?: number | null;
  nameservers: string[];
  dnsRecords: DnsRecord[] | null;
  dnsZone?: string | null;
  sslCertificateStatus?: string;
  autoRenew?: boolean;
  whoisStatus?: string | null;
  domainStatus: string;
  effectiveDomainStatus: string;
  history?: HistoryEntry[];
};

type Tab = "overview" | "history" | "dns" | "nameservers";

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "ACTIVE") return "success";
  if (status === "EXPIRING_SOON") return "warning";
  if (status === "EXPIRED" || status === "SUSPENDED") return "destructive";
  return "secondary";
}

export function ManagedDomainDetailView({ domainId }: { domainId: string }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [data, setData] = useState<ManagedDomain | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nsInput, setNsInput] = useState("");
  const [live, setLive] = useState<LiveDnsSnapshot | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

  const loadLive = useCallback(() => {
    setLiveLoading(true);
    fetch(`/api/domains/${domainId}/live-dns`)
      .then(async (r) => {
        const d = await r.json();
        if (d.success) setLive(d.data.live);
      })
      .catch(() => {})
      .finally(() => setLiveLoading(false));
  }, [domainId]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/domains/${domainId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setData(d.data);
        setNsInput((d.data.nameservers ?? []).join("\n"));
        setDnsRecords(d.data.dnsRecords ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
    loadLive();
  }, [domainId, loadLive]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNameservers(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setBusy(true);
    setError("");
    const nameservers = nsInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const r = await fetch(`/api/domains/${domainId}/nameservers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameservers }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to update nameservers");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function syncFromLive() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/domains/${domainId}/live-dns`, { method: "POST" });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Sync failed");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  const displayRecords =
    dnsRecords.length > 0 ? dnsRecords : (live?.records ?? []);
  const displayNameservers =
    (data?.nameservers?.length ? data.nameservers : live?.nameservers) ?? [];

  async function saveDns(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/domains/${domainId}/dns`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: dnsRecords, action: "DNS_RECORD_UPDATED" }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to update DNS");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ErrorState message="Domain not found" onRetry={load} />;

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff/domains">Domains</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{data.domainName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title !mb-1 font-mono">{data.domainName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.effectiveDomainStatus)}>
              {data.effectiveDomainStatus.replace("_", " ")}
            </Badge>
            {data.purchasedViaMernCrest ? (
              <span className="stitch-chip stitch-chip-violet text-xs">MernCrest managed</span>
            ) : (
              <span className="stitch-chip text-xs">External registrar</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="stitch-btn-outline-sm"
            onClick={syncFromLive}
            disabled={busy || liveLoading}
          >
            {busy || liveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync live DNS
          </button>
          <Link href="/staff/domains" className="stitch-btn-outline-sm">
            <ArrowLeft className="h-4 w-4" />
            All domains
          </Link>
        </div>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-tab-row mb-4">
        {(
          [
            ["overview", "Overview"],
            ["history", `History (${data.history?.length ?? 0})`],
            ["dns", "DNS records"],
            ["nameservers", "Nameservers"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="stitch-section-card">
          <div className="stitch-section-body grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-[var(--sp-muted)]">Extension</span>
              <p className="font-medium">.{data.domainExtension || "—"}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Registrar</span>
              <p className="font-medium">{registrarLabel(data.registrar)}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Registered</span>
              <p className="font-medium">{formatSriLankaDate(data.registrationDate)}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Expires</span>
              <p className="font-medium">{formatSriLankaDate(data.expiryDate)}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Renewal date</span>
              <p className="font-medium">
                {data.renewalDate ? formatSriLankaDate(data.renewalDate) : "—"}
              </p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Registration period</span>
              <p className="font-medium">
                {data.registrationPeriodMonths ? `${data.registrationPeriodMonths} months` : "—"}
              </p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">DNS zone</span>
              <p className="font-medium font-mono text-xs">{data.dnsZone || data.domainName}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">SSL status</span>
              <p className="font-medium">{data.sslCertificateStatus ?? "—"}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Auto-renew</span>
              <p className="font-medium">{data.autoRenew ? "Enabled" : "Disabled"}</p>
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">WHOIS status</span>
              <p className="font-medium">
                {data.whoisStatus || live?.rdap?.whoisStatus || "—"}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-[var(--sp-muted)]">Live nameservers</span>
              {displayNameservers.length === 0 ? (
                <p className="font-medium m-0">—</p>
              ) : (
                <ul className="font-mono text-xs m-0 mt-1 space-y-1">
                  {displayNameservers.map((ns) => (
                    <li key={ns}>{ns}</li>
                  ))}
                </ul>
              )}
              {live?.fetchedAt ? (
                <p className="text-xs text-[var(--sp-muted)] m-0 mt-2">
                  Live lookup: {formatSriLankaDateTime(live.fetchedAt)}
                  {live.sslCertificateStatus ? ` · SSL: ${live.sslCertificateStatus}` : ""}
                </p>
              ) : null}
            </div>
            <div>
              <span className="text-[var(--sp-muted)]">Service ID</span>
              <p className="font-mono text-xs">{data.projectServiceId}</p>
            </div>
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="stitch-section-card">
          <div className="stitch-section-body overflow-x-auto !p-0">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                </tr>
              </thead>
              <tbody>
                {(data.history ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-[var(--sp-muted)] py-8">
                      No history entries.
                    </td>
                  </tr>
                ) : (
                  (data.history ?? []).map((h) => (
                    <tr key={h.id}>
                      <td>{formatSriLankaDateTime(h.createdAt)}</td>
                      <td className="font-medium">{h.action.replace(/_/g, " ")}</td>
                      <td className="font-mono text-xs">{h.createdBy.slice(0, 8)}…</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "dns" && (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>DNS records {live ? `(${displayRecords.length} live/stored)` : ""}</h3>
            <div className="flex gap-2">
              <button type="button" className="stitch-btn-sm" onClick={loadLive} disabled={liveLoading}>
                {liveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh live"}
              </button>
              <button
                type="button"
                className="stitch-btn-sm"
                onClick={() =>
                  setDnsRecords((r) => [...r, { type: "A", name: "@", value: "", ttl: 3600 }])
                }
              >
                Add record
              </button>
            </div>
          </div>
          {displayRecords.length > 0 ? (
            <div className="stitch-section-body overflow-x-auto !pt-0">
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Value</th>
                    <th>TTL</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRecords.map((rec, idx) => (
                    <tr key={`${rec.type}-${rec.name}-${rec.value}-${idx}`}>
                      <td className="font-mono text-xs">{rec.type}</td>
                      <td>{rec.name}</td>
                      <td className="font-mono text-xs max-w-xs truncate">{rec.value}</td>
                      <td>{rec.ttl}</td>
                      <td>{rec.priority ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <form onSubmit={saveDns} className="stitch-section-body space-y-3 border-t border-[var(--sp-outline)]">
            <p className="text-sm text-[var(--sp-muted)] m-0">
              Edit stored DNS records below. Use &quot;Sync live DNS&quot; to import public records.
            </p>
            {dnsRecords.length === 0 ? (
              <p className="text-sm text-[var(--sp-muted)]">No stored records — showing live DNS above.</p>
            ) : (
              dnsRecords.map((rec, idx) => (
                <div key={idx} className="grid sm:grid-cols-5 gap-2 items-end">
                  <select
                    className="stitch-input"
                    value={rec.type}
                    onChange={(e) =>
                      setDnsRecords((rows) =>
                        rows.map((r, i) =>
                          i === idx ? { ...r, type: e.target.value as DnsRecord["type"] } : r
                        )
                      )
                    }
                  >
                    {["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "REDIRECT"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    className="stitch-input"
                    placeholder="Name"
                    value={rec.name}
                    onChange={(e) =>
                      setDnsRecords((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
                      )
                    }
                  />
                  <input
                    className="stitch-input sm:col-span-2"
                    placeholder="Value"
                    value={rec.value}
                    onChange={(e) =>
                      setDnsRecords((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                      )
                    }
                  />
                  <input
                    type="number"
                    className="stitch-input"
                    placeholder="TTL"
                    value={rec.ttl}
                    onChange={(e) =>
                      setDnsRecords((rows) =>
                        rows.map((r, i) =>
                          i === idx ? { ...r, ttl: Number(e.target.value) || 3600 } : r
                        )
                      )
                    }
                  />
                </div>
              ))
            )}
            {dnsRecords.length > 0 ? (
              <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save DNS"}
              </button>
            ) : null}
          </form>
        </section>
      )}

      {tab === "nameservers" && (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Nameservers</h3>
            <button type="button" className="stitch-btn-sm" onClick={loadLive} disabled={liveLoading}>
              Refresh live
            </button>
          </div>
          <div className="stitch-section-body space-y-4">
            {live?.nameservers?.length ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--sp-muted)] mb-2">
                  Live public DNS
                </p>
                <ul className="font-mono text-sm m-0 space-y-1 bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
                  {live.nameservers.map((ns) => (
                    <li key={ns}>{ns}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-[var(--sp-muted)]">No live nameservers resolved.</p>
            )}
            <form onSubmit={saveNameservers} className="space-y-3">
              <p className="text-sm text-[var(--sp-muted)] m-0">Stored nameservers (one per line).</p>
            <textarea
              className="stitch-input w-full min-h-[120px] font-mono text-sm"
              value={nsInput}
              onChange={(e) => setNsInput(e.target.value)}
              placeholder="ns1.example.com&#10;ns2.example.com"
            />
            <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save nameservers"}
            </button>
          </form>
          </div>
        </section>
      )}
    </div>
  );
}
