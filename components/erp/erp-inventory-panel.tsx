"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Item = {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitCostCents: number;
};

export function ErpInventoryPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [lowStock, setLowStock] = useState<Item[]>([]);
  const [form, setForm] = useState({ sku: "", name: "", category: "Supplies", quantity: 10 });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/inventory");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setItems(data.items ?? []);
      setLowStock(data.lowStock ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/erp/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, unitCostCents: 50000 }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setForm({ sku: "", name: "", category: "Supplies", quantity: 10 });
      await load();
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {lowStock.length > 0 && (
        <p className="text-sm text-amber-400">{lowStock.length} SKU(s) at or below reorder level</p>
      )}
      <form onSubmit={create} className="flex flex-wrap gap-2">
        <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
          placeholder="SKU" className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name" className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" size="sm">Add SKU</Button>
      </form>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className={`rounded-lg border p-3 text-sm flex justify-between ${
            i.quantity <= i.reorderLevel ? "border-amber-500/40" : "border-white/10"
          }`}>
            <div>
              <p className="font-mono text-xs text-accent">{i.sku}</p>
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-muted">{i.category} · reorder @ {i.reorderLevel}</p>
            </div>
            <div className="flex items-center gap-2">
              <span>Qty {i.quantity}</span>
              <Button size="sm" variant="outline" onClick={async () => {
                await fetch("/api/erp/inventory", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: i.id, delta: 1 }),
                });
                await load();
              }}>+1</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                await fetch("/api/erp/inventory", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: i.id, delta: -1 }),
                });
                await load();
              }}>−1</Button>
              <span className="text-xs text-muted">{formatMoney(i.unitCostCents)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
