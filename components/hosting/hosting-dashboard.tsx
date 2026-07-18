"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

type Account = {
  id: string;
  label: string;
  planCode: string;
  status: string;
  primaryDomain: string | null;
  diskMb: number;
  diskUsedMb: number;
  bandwidthGb: number;
  bandwidthUsedGb: number;
  cpuPercent: number;
  ramMb: number;
  ramUsedMb: number;
  sslStatus: string;
  backupStatus: string;
  panelUrl: string | null;
  renewsAt: string | null;
};

export function HostingDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [subs, setSubs] = useState<Array<{ productName: string; status: string; nextBillingAt: string | null; amountCents: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hosting")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts ?? []);
        setSubs(d.subscriptions ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading hosting…</p>;

  if (accounts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted text-sm">No hosting accounts yet. Order hosting and pay an invoice to provision.</p>
        <Button asChild><Link href="/hosting">Browse hosting</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {accounts.map((a) => (
        <div key={a.id} className="rounded-xl border border-white/10 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-semibold">{a.label}</h2>
              <p className="text-xs text-muted font-mono mt-1">
                {a.planCode} · {a.status}
                {a.primaryDomain ? ` · ${a.primaryDomain}` : ""}
              </p>
            </div>
            {a.panelUrl && (
              <Button asChild size="sm" variant="outline">
                <a href={a.panelUrl} target="_blank" rel="noopener noreferrer">Control panel</a>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Metric label="Disk" value={`${a.diskUsedMb}/${a.diskMb} MB`} pct={(a.diskUsedMb / a.diskMb) * 100} />
            <Metric label="Bandwidth" value={`${a.bandwidthUsedGb}/${a.bandwidthGb} GB`} pct={(a.bandwidthUsedGb / a.bandwidthGb) * 100} />
            <Metric label="CPU" value={`${a.cpuPercent}%`} pct={a.cpuPercent} />
            <Metric label="RAM" value={`${a.ramUsedMb}/${a.ramMb} MB`} pct={(a.ramUsedMb / a.ramMb) * 100} />
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span>SSL: {a.sslStatus}</span>
            <span>Backup: {a.backupStatus}</span>
            <span>Renews: {a.renewsAt ? new Date(a.renewsAt).toLocaleDateString() : "—"}</span>
          </div>
        </div>
      ))}

      {subs.length > 0 && (
        <div>
          <h3 className="font-display font-semibold mb-3">Subscriptions</h3>
          <ul className="space-y-2 text-sm">
            {subs.map((s, i) => (
              <li key={i} className="flex justify-between border-b border-white/5 py-2">
                <span>{s.productName} · {s.status}</span>
                <span className="text-muted">
                  Next {s.nextBillingAt ? new Date(s.nextBillingAt).toLocaleDateString() : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <p className="text-xs font-mono text-muted uppercase">{label}</p>
      <p className="font-medium mt-1">{value}</p>
      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}
