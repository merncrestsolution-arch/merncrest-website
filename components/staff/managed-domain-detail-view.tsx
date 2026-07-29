"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

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
  }, [domainId]);

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
        <Link href="/staff/domains" className="stitch-btn-outline-sm">
          <ArrowLeft className="h-4 w-4" />
          All domains
        </Link>
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
              <p className="font-medium">{data.whoisStatus || "—"}</p>
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
            <h3>DNS records</h3>
            <button
              type="button"
              className="stitch-btn-sm"
              onClick={() =>
                setDnsRecords((r) => [
                  ...r,
                  { type: "A", name: "@", value: "", ttl: 3600 },
                ])
              }
            >
              Add record
            </button>
          </div>
          <form onSubmit={saveDns} className="stitch-section-body space-y-3">
            {dnsRecords.length === 0 ? (
              <p className="text-sm text-[var(--sp-muted)]">No DNS records configured.</p>
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
            <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save DNS"}
            </button>
          </form>
        </section>
      )}

      {tab === "nameservers" && (
        <section className="stitch-section-card">
          <div className="stitch-section-head">
            <h3>Nameservers</h3>
          </div>
          <form onSubmit={saveNameservers} className="stitch-section-body space-y-3">
            <p className="text-sm text-[var(--sp-muted)] m-0">One nameserver per line.</p>
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
        </section>
      )}
    </div>
  );
}
