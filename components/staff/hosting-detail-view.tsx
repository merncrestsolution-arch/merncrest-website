"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
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
import { LoadingState } from "@/components/system/loading-state";
import { ErrorState } from "@/components/system/error-state";
import { Button } from "@/components/ui/button";

type CredentialField = "panelUsername" | "panelPassword" | "databaseUsername" | "databasePassword";

type HostingDetail = {
  id: string;
  label: string;
  planCode: string;
  status: string;
  sslStatus: string;
  sslExpiresAt: string | null;
  renewsAt: string | null;
  activatedAt: string | null;
  panelUrl: string | null;
  serverIp: string | null;
  serverSpecs: string | null;
  serverLocation: string | null;
  accountId: string | null;
  provider: string | null;
  renewalPeriodMonths: number | null;
  renewalCostCents: number;
  linkedDomains: string[];
  diskMb: number;
  diskUsedMb: number;
  bandwidthGb: number;
  bandwidthUsedGb: number;
  cpuPercent: number;
  ramMb: number;
  ramUsedMb: number;
  backupStatus: string;
  client: { id: string; name: string; email: string };
  credentials: {
    hasPanelUsername: boolean;
    hasPanelPassword: boolean;
    hasDatabaseUsername: boolean;
    hasDatabasePassword: boolean;
    panelUsernameMasked: string;
    panelPasswordMasked: string;
    databaseName: string | null;
    databaseUsernameMasked: string;
    databasePasswordMasked: string;
  };
};

type Revealed = Record<CredentialField, string | null>;

function sslVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "Active") return "success";
  if (status === "Expiring Soon") return "warning";
  if (status === "Expired" || status === "Not Configured") return "destructive";
  return "secondary";
}

function CredentialRow({
  label,
  masked,
  field,
  hasValue,
  revealed,
  onReveal,
  busy,
}: {
  label: string;
  masked: string;
  field: CredentialField;
  hasValue: boolean;
  revealed: Revealed;
  onReveal: (field: CredentialField) => void;
  busy: boolean;
}) {
  const value = revealed[field];
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[var(--sp-border)] last:border-0">
      <div>
        <span className="text-sm text-[var(--sp-muted)]">{label}</span>
        <p className="font-mono text-sm mt-0.5">{value ?? masked}</p>
      </div>
      {hasValue ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onReveal(field)}
        >
          {value ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {value ? "Hide" : "Reveal"}
        </Button>
      ) : (
        <span className="text-xs text-[var(--sp-muted)]">Not set</span>
      )}
    </div>
  );
}

export function HostingDetailView({ hostingId }: { hostingId: string }) {
  const [data, setData] = useState<HostingDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<Revealed>({
    panelUsername: null,
    panelPassword: null,
    databaseUsername: null,
    databasePassword: null,
  });

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/staff/hosting/${hostingId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setData(d.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [hostingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function reveal(field: CredentialField) {
    if (revealed[field]) {
      setRevealed((prev) => ({ ...prev, [field]: null }));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/hosting/${hostingId}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Reveal failed");
      setRevealed((prev) => ({ ...prev, [field]: d.data.value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reveal failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ErrorState message="Hosting account not found" />;

  const cred = data.credentials;

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff/hosting">Hosting</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{data.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="stitch-page-title">{data.label}</h1>
          <p className="stitch-page-sub !mb-0">
            <Link href={`/staff/clients/${data.client.id}`} className="text-violet-400 hover:underline">
              {data.client.name}
            </Link>
            · {data.planCode}
            {data.provider ? ` · ${data.provider}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={sslVariant(data.sslStatus)}>SSL: {data.sslStatus}</Badge>
          <Badge variant="secondary">{data.status}</Badge>
        </div>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="server">Server</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-[var(--sp-muted)]">Account ID</span>
                <span className="font-mono">{data.accountId || "—"}</span>
                <span className="text-[var(--sp-muted)]">Activated</span>
                <span>{formatSriLankaDate(data.activatedAt)}</span>
                <span className="text-[var(--sp-muted)]">Renews</span>
                <span>{formatSriLankaDate(data.renewsAt)}</span>
                <span className="text-[var(--sp-muted)]">Renewal cost</span>
                <span>{formatMoney(data.renewalCostCents)}</span>
                <span className="text-[var(--sp-muted)]">SSL expires</span>
                <span>{formatSriLankaDate(data.sslExpiresAt)}</span>
                <span className="text-[var(--sp-muted)]">Panel URL</span>
                <span>
                  {data.panelUrl ? (
                    <a
                      href={data.panelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:underline inline-flex items-center gap-1"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked domains</CardTitle>
              </CardHeader>
              <CardContent>
                {data.linkedDomains.length === 0 ? (
                  <p className="text-sm text-[var(--sp-muted)]">No linked domains</p>
                ) : (
                  <ul className="space-y-1 font-mono text-sm">
                    {data.linkedDomains.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
              <p className="text-xs text-[var(--sp-muted)]">
                Values are encrypted at rest. Reveal is permission-gated and audit-logged.
              </p>
            </CardHeader>
            <CardContent>
              <CredentialRow
                label="Panel username"
                masked={cred.panelUsernameMasked}
                field="panelUsername"
                hasValue={cred.hasPanelUsername}
                revealed={revealed}
                onReveal={reveal}
                busy={busy}
              />
              <CredentialRow
                label="Panel password"
                masked={cred.panelPasswordMasked}
                field="panelPassword"
                hasValue={cred.hasPanelPassword}
                revealed={revealed}
                onReveal={reveal}
                busy={busy}
              />
              {cred.databaseName ? (
                <div className="py-2 border-b border-[var(--sp-border)]">
                  <span className="text-sm text-[var(--sp-muted)]">Database name</span>
                  <p className="font-mono text-sm mt-0.5">{cred.databaseName}</p>
                </div>
              ) : null}
              <CredentialRow
                label="Database username"
                masked={cred.databaseUsernameMasked}
                field="databaseUsername"
                hasValue={cred.hasDatabaseUsername}
                revealed={revealed}
                onReveal={reveal}
                busy={busy}
              />
              <CredentialRow
                label="Database password"
                masked={cred.databasePasswordMasked}
                field="databasePassword"
                hasValue={cred.hasDatabasePassword}
                revealed={revealed}
                onReveal={reveal}
                busy={busy}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="server">
          <Card>
            <CardHeader>
              <CardTitle>Server details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-[var(--sp-muted)]">IP address</span>
              <span className="font-mono">{data.serverIp || "—"}</span>
              <span className="text-[var(--sp-muted)]">Location</span>
              <span>{data.serverLocation || "—"}</span>
              <span className="text-[var(--sp-muted)]">Disk</span>
              <span>
                {data.diskUsedMb} / {data.diskMb} MB (
                {Math.round((data.diskUsedMb / data.diskMb) * 100)}%)
              </span>
              <span className="text-[var(--sp-muted)]">Bandwidth</span>
              <span>
                {data.bandwidthUsedGb} / {data.bandwidthGb} GB
              </span>
              <span className="text-[var(--sp-muted)]">RAM</span>
              <span>
                {data.ramUsedMb} / {data.ramMb} MB
              </span>
              <span className="text-[var(--sp-muted)]">CPU allocation</span>
              <span>{data.cpuPercent}%</span>
              <span className="text-[var(--sp-muted)]">Backup</span>
              <span>{data.backupStatus}</span>
              {data.serverSpecs ? (
                <>
                  <span className="text-[var(--sp-muted)]">Specs</span>
                  <span className="col-span-1">{data.serverSpecs}</span>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
