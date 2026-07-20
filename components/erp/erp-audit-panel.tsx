"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Log = {
  id: string;
  action: string;
  module: string;
  summary: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export function ErpAuditPanel() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [module, setModule] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (module) params.set("module", module);
    const res = await fetch(`/api/erp/audit?${params}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setLogs(data.logs ?? []);
      setStats(data.stats ?? {});
    }
  }, [q, module]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Searchable audit trail across ERP, Finance, Approvals, and Org changes.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          placeholder="Search summary / actor…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          <option value="">All modules</option>
          {Object.keys(stats).map((m) => (
            <option key={m} value={m}>
              {m} ({stats[m]})
            </option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>
      <ul className="space-y-2 max-h-[560px] overflow-y-auto">
        {logs.map((l) => (
          <li key={l.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-xs font-mono text-violet-300">
                {l.module} · {l.action}
              </span>
              <span className="text-xs text-muted">
                {new Date(l.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1">{l.summary}</p>
            <p className="text-xs text-muted mt-0.5">
              {l.actorName || l.actorEmail || "System"}
            </p>
          </li>
        ))}
        {logs.length === 0 && (
          <li className="text-sm text-muted">No audit events yet. Actions will appear here.</li>
        )}
      </ul>
    </div>
  );
}
