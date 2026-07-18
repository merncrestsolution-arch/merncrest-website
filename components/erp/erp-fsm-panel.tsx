"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type WO = {
  id: string;
  workNumber: string;
  title: string;
  status: string;
  priority: string;
  assetCode?: string | null;
  assignee?: { fullName: string } | null;
};

export function ErpFsmPanel() {
  const [workOrders, setWorkOrders] = useState<WO[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/fsm");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setWorkOrders(data.workOrders ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/erp/fsm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority: "MEDIUM" }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setTitle("");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form onSubmit={create} className="flex gap-2 max-w-md">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Work order title"
          className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit">Create</Button>
      </form>
      <ul className="space-y-2">
        {workOrders.map((w) => (
          <li key={w.id} className="rounded-lg border border-white/10 p-3 text-sm flex justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-accent">{w.workNumber}</p>
              <p className="font-medium">{w.title}</p>
              <p className="text-xs text-muted">{w.priority} · {w.status}</p>
            </div>
            <Button size="sm" variant="outline" onClick={async () => {
              const next =
                w.status === "OPEN" ? "IN_PROGRESS" : w.status === "IN_PROGRESS" ? "DONE" : "OPEN";
              await fetch("/api/erp/fsm", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: w.id, status: next }),
              });
              await load();
            }}>
              Advance
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
