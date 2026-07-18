"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ErpEsmPanel() {
  const [catalog, setCatalog] = useState<{ id: string; code: string; name: string; category: string; slaHours: number }[]>([]);
  const [incidents, setIncidents] = useState<{ id: string; incidentNumber: string; title: string; type: string; status: string; priority: string }[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/esm");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setCatalog(data.catalog ?? []);
      setIncidents(data.incidents ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/erp/esm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, type: "INCIDENT", priority: "HIGH" }),
          });
          setTitle("");
          await load();
        }}
      >
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident / request title"
          className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" size="sm">Log incident</Button>
      </form>
      <div className="grid lg:grid-cols-2 gap-6">
        <ul className="space-y-2">
          <h3 className="font-semibold text-sm">Service catalog</h3>
          {catalog.length === 0 && <li className="text-sm text-muted">No catalog items yet.</li>}
          {catalog.map((c) => (
            <li key={c.id} className="border border-white/10 rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-accent">{c.code}</p>
              <p>{c.name} · {c.category}</p>
              <p className="text-xs text-muted">SLA {c.slaHours}h</p>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          <h3 className="font-semibold text-sm">Incidents / changes</h3>
          {incidents.map((i) => (
            <li key={i.id} className="border border-white/10 rounded-lg p-3 text-sm flex justify-between">
              <div>
                <p className="font-mono text-xs text-accent">{i.incidentNumber}</p>
                <p>{i.title}</p>
                <p className="text-xs text-muted">{i.type} · {i.priority} · {i.status}</p>
              </div>
              <Button size="sm" variant="outline" onClick={async () => {
                await fetch("/api/erp/esm", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: i.id, status: i.status === "OPEN" ? "IN_PROGRESS" : "RESOLVED" }),
                });
                await load();
              }}>Update</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
