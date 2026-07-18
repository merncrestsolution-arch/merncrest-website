"use client";

import { useCallback, useEffect, useState } from "react";
import { DomainSearch } from "@/components/domains/domain-search";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

type DnsRecord = { id: string; type: string; host: string; value: string; ttl: number; priority: number | null };
type Domain = {
  id: string;
  name: string;
  tld: string;
  status: string;
  autoRenew: boolean;
  locked: boolean;
  expiresAt: string | null;
  nameservers: string;
  dnsRecords: DnsRecord[];
};

export function DomainsManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/domains");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDomains(data.domains ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(domainId: string, patch: Partial<{ autoRenew: boolean; locked: boolean }>) {
    await fetch("/api/domains", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId, ...patch }),
    });
    await load();
  }

  async function addDns(domainId: string) {
    const host = prompt("Host (e.g. @ or www)");
    const type = prompt("Type (A, CNAME, MX, TXT)", "A");
    const value = prompt("Value");
    if (!host || !type || !value) return;
    await fetch("/api/domains/dns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domainId, type, host, value }),
    });
    await load();
  }

  async function removeDns(id: string) {
    await fetch(`/api/domains/dns?id=${id}`, { method: "DELETE" });
    await load();
  }

  const active = domains.find((d) => d.id === selected) || domains[0];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-lg font-semibold mb-4">Search domains</h2>
        <DomainSearch />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Your domains</h2>
          <Button asChild size="sm" variant="outline"><Link href="/domains">Public search</Link></Button>
        </div>
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && domains.length === 0 && (
          <p className="text-sm text-muted">No domains yet. Search above, checkout, and pay to activate.</p>
        )}
        <div className="space-y-3">
          {domains.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelected(d.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                active?.id === d.id ? "border-accent/50 bg-accent/5" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex justify-between gap-3">
                <p className="font-mono font-medium">{d.name}.{d.tld}</p>
                <span className="text-xs font-mono text-accent">{d.status}</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Expires {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}
                {d.autoRenew ? " · Auto-renew on" : " · Auto-renew off"}
                {d.locked ? " · Locked" : ""}
              </p>
            </button>
          ))}
        </div>

        {active && (
          <div className="rounded-xl border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => toggle(active.id, { autoRenew: !active.autoRenew })}>
                {active.autoRenew ? "Disable auto-renew" : "Enable auto-renew"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggle(active.id, { locked: !active.locked })}>
                {active.locked ? "Unlock" : "Lock domain"}
              </Button>
              <Button size="sm" onClick={() => addDns(active.id)}>Add DNS record</Button>
            </div>
            <p className="text-xs text-muted">Nameservers: {active.nameservers}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-white/10">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Host</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {active.dnsRecords.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="py-2 pr-3 font-mono text-xs">{r.type}</td>
                      <td className="py-2 pr-3">{r.host}</td>
                      <td className="py-2 pr-3 truncate max-w-[200px]">{r.value}</td>
                      <td className="py-2">
                        <button type="button" className="text-xs text-red-400" onClick={() => removeDns(r.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
