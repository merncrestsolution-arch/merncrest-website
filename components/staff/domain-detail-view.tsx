"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/system/empty-state";
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";
import { Button } from "@/components/ui/button";

type DomainDetail = {
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
  renewalPeriodMonths: number | null;
  renewalCostCents: number;
  nameservers: string[];
  autoRenew: boolean;
  locked: boolean;
  client: { id: string; name: string; email: string };
  dnsRecords: Array<{
    id: string;
    type: string;
    host: string;
    value: string;
    ttl: number;
    priority: number | null;
  }>;
};

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "Active") return "success";
  if (status === "Expiring Soon") return "warning";
  if (status === "Expired" || status === "Cancelled") return "destructive";
  return "secondary";
}

export function DomainDetailView({ domainId }: { domainId: string }) {
  const [data, setData] = useState<DomainDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dnsForm, setDnsForm] = useState({ type: "A", host: "@", value: "", ttl: 3600 });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/staff/domains/${domainId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setData(d.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [domainId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addDns(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/domains/${domainId}/dns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dnsForm),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      setDnsForm({ type: "A", host: "@", value: "", ttl: 3600 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDns(recordId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/domains/${domainId}/dns?recordId=${recordId}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ErrorState message="Domain not found" />;

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
            <BreadcrumbPage>{data.fqdn}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="stitch-page-title font-mono">{data.fqdn}</h1>
          <p className="stitch-page-sub !mb-0">
            <Link href={`/staff/clients/${data.client.id}`} className="text-violet-400 hover:underline">
              {data.client.name}
            </Link>
            · {data.client.email}
          </p>
        </div>
        <Badge variant={statusVariant(data.displayStatus)}>{data.displayStatus}</Badge>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dns">DNS ({data.dnsRecords.length})</TabsTrigger>
          <TabsTrigger value="nameservers">Nameservers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-[var(--sp-muted)]">Registrar</span>
                <span>{data.registrar || "—"}</span>
                <span className="text-[var(--sp-muted)]">Registered</span>
                <span>{formatSriLankaDate(data.registeredAt)}</span>
                <span className="text-[var(--sp-muted)]">Expires</span>
                <span>{formatSriLankaDate(data.expiresAt)}</span>
                <span className="text-[var(--sp-muted)]">Registration cost</span>
                <span>{formatMoney(data.registrationCostCents)}</span>
                <span className="text-[var(--sp-muted)]">Renewal cost</span>
                <span>{formatMoney(data.renewalCostCents)}</span>
                <span className="text-[var(--sp-muted)]">Renewal period</span>
                <span>
                  {data.renewalPeriodMonths ? `${data.renewalPeriodMonths} months` : "—"}
                </span>
                <span className="text-[var(--sp-muted)]">Free package</span>
                <span>
                  {data.isFreeProvided
                    ? data.freeDurationLabel || "Yes"
                    : "No"}
                </span>
                <span className="text-[var(--sp-muted)]">Auto-renew</span>
                <span>{data.autoRenew ? "On" : "Off"}</span>
                <span className="text-[var(--sp-muted)]">Locked</span>
                <span>{data.locked ? "Yes" : "No"}</span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dns">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add DNS record</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addDns} className="grid md:grid-cols-5 gap-2">
                <select
                  className="stitch-input"
                  value={dnsForm.type}
                  onChange={(e) => setDnsForm({ ...dnsForm, type: e.target.value })}
                >
                  {["A", "AAAA", "CNAME", "MX", "TXT", "NS"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  className="stitch-input"
                  placeholder="Host"
                  value={dnsForm.host}
                  onChange={(e) => setDnsForm({ ...dnsForm, host: e.target.value })}
                />
                <input
                  className="stitch-input md:col-span-2"
                  placeholder="Value"
                  value={dnsForm.value}
                  onChange={(e) => setDnsForm({ ...dnsForm, value: e.target.value })}
                  required
                />
                <Button type="submit" size="sm" disabled={busy}>Add</Button>
              </form>
            </CardContent>
          </Card>

          {data.dnsRecords.length === 0 ? (
            <EmptyState title="No DNS records" description="Add records above or they will appear after provisioning." />
          ) : (
            <section className="stitch-section-card">
              <div className="stitch-section-body overflow-x-auto !p-0">
                <table className="stitch-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Host</th>
                      <th>Value</th>
                      <th>TTL</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dnsRecords.map((r) => (
                      <tr key={r.id}>
                        <td>{r.type}</td>
                        <td className="font-mono text-sm">{r.host}</td>
                        <td className="font-mono text-sm max-w-xs truncate">{r.value}</td>
                        <td>{r.ttl}</td>
                        <td>
                          <button
                            type="button"
                            className="stitch-btn-danger-sm"
                            disabled={busy}
                            onClick={() => deleteDns(r.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="nameservers">
          {data.nameservers.length === 0 ? (
            <EmptyState title="No nameservers" />
          ) : (
            <Card>
              <CardContent className="pt-5">
                <ul className="space-y-2 font-mono text-sm">
                  {data.nameservers.map((ns) => (
                    <li key={ns} className="rounded-lg border border-[var(--sp-border)] px-3 py-2">
                      {ns}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
