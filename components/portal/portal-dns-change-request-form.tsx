"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { DnsRecord } from "@/shared/service-types";

type ManagedDomain = {
  id: string;
  domainName: string;
  purchasedViaMernCrest: boolean;
  dnsRecords: DnsRecord[] | null;
};

export function PortalDnsChangeRequestForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [domains, setDomains] = useState<ManagedDomain[]>([]);
  const [domainId, setDomainId] = useState("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<DnsRecord[]>([{ type: "A", name: "@", value: "", ttl: 3600 }]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portal/managed-domains")
      .then((r) => r.json())
      .then((d) => {
        const managed = (d.data ?? []).filter((x: ManagedDomain) => x.purchasedViaMernCrest);
        setDomains(managed);
        if (managed[0]) setDomainId(managed[0].id);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!domainId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/portal/dns-change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDomainId: domainId,
          proposedRecords: records.filter((rec) => rec.value.trim()),
          clientNotes: notes || undefined,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message ?? "Failed to submit request");
      setMessage("DNS change request submitted. An administrator will review it shortly.");
      setNotes("");
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (domains.length === 0) return null;

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-white/10 space-y-3">
      <p className="text-sm font-medium">Request DNS change</p>
      <p className="text-xs text-muted m-0">
        MernCrest-managed domains require administrator approval for DNS changes.
      </p>
      <select
        className="rlk-input w-full text-sm"
        value={domainId}
        onChange={(e) => setDomainId(e.target.value)}
      >
        {domains.map((d) => (
          <option key={d.id} value={d.id}>
            {d.domainName}
          </option>
        ))}
      </select>
      {records.map((rec, idx) => (
        <div key={idx} className="grid grid-cols-4 gap-2">
          <select
            className="rlk-input text-xs"
            value={rec.type}
            onChange={(e) =>
              setRecords((rows) =>
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
            className="rlk-input text-xs"
            placeholder="Name"
            value={rec.name}
            onChange={(e) =>
              setRecords((rows) =>
                rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r))
              )
            }
          />
          <input
            className="rlk-input text-xs col-span-2"
            placeholder="Value"
            value={rec.value}
            onChange={(e) =>
              setRecords((rows) =>
                rows.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
              )
            }
          />
        </div>
      ))}
      <button type="button" className="rlk-link text-xs" onClick={() => setRecords((r) => [...r, { type: "A", name: "@", value: "", ttl: 3600 }])}>
        + Add record
      </button>
      <textarea
        className="rlk-input w-full text-sm min-h-[60px]"
        placeholder="Notes for the administrator"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error ? <p className="text-red-400 text-xs">{error}</p> : null}
      {message ? <p className="text-emerald-400 text-xs">{message}</p> : null}
      <button type="submit" className="rlk-btn rlk-btn-primary text-sm" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit DNS change request"}
      </button>
    </form>
  );
}
