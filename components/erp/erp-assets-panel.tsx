"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Asset = {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: string;
  location?: string | null;
  purchaseCents: number;
};

export function ErpAssetsPanel() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState({ name: "", category: "IT Hardware", location: "Colombo HQ" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/assets");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setAssets(data.assets ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/erp/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, purchaseCents: 25000000 }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setForm({ name: "", category: "IT Hardware", location: "Colombo HQ" });
      await load();
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <form onSubmit={create} className="flex flex-wrap gap-2">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Asset name" className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" size="sm">Add asset</Button>
      </form>
      <ul className="space-y-2">
        {assets.map((a) => (
          <li key={a.id} className="rounded-lg border border-white/10 p-3 text-sm flex justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-accent">{a.assetCode}</p>
              <p className="font-medium">{a.name}</p>
              <p className="text-xs text-muted">{a.category} · {a.status} · {a.location}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p>{formatMoney(a.purchaseCents)}</p>
              <Button size="sm" variant="outline" onClick={async () => {
                await fetch("/api/erp/assets", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: a.id,
                    status: a.status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE",
                  }),
                });
                await load();
              }}>
                {a.status === "MAINTENANCE" ? "Mark available" : "Maintenance"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
