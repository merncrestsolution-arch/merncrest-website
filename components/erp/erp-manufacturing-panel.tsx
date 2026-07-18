"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ErpManufacturingPanel() {
  const [boms, setBoms] = useState<{ id: string; bomCode: string; productName: string; lines: { componentSku: string; quantity: number }[] }[]>([]);
  const [orders, setOrders] = useState<{ id: string; orderNumber: string; productName: string; quantity: number; status: string }[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/manufacturing");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setBoms(data.boms ?? []);
      setOrders(data.orders ?? []);
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
          const bomRes = await fetch("/api/erp/manufacturing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "bom",
              productName: name,
              lines: [
                { componentSku: "SSD-1TB", quantity: 1 },
                { componentSku: "CBL-CAT6", quantity: 2 },
              ],
            }),
          });
          const bomData = await bomRes.json();
          await fetch("/api/erp/manufacturing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productName: name,
              quantity: 10,
              bomId: bomData.bom?.id,
            }),
          });
          setName("");
          await load();
        }}
      >
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Product / BOM name"
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="submit" size="sm">Create BOM + MO</Button>
      </form>
      <div className="grid lg:grid-cols-2 gap-6">
        <ul className="space-y-2">
          <h3 className="font-semibold text-sm">Bills of Materials</h3>
          {boms.map((b) => (
            <li key={b.id} className="border border-white/10 rounded-lg p-3 text-sm">
              <p className="font-mono text-xs text-accent">{b.bomCode}</p>
              <p className="font-medium">{b.productName}</p>
              <p className="text-xs text-muted mt-1">
                {b.lines.map((l) => `${l.componentSku}×${l.quantity}`).join(", ") || "No lines"}
              </p>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          <h3 className="font-semibold text-sm">Production orders</h3>
          {orders.map((o) => (
            <li key={o.id} className="border border-white/10 rounded-lg p-3 text-sm flex justify-between">
              <div>
                <p className="font-mono text-xs text-accent">{o.orderNumber}</p>
                <p>{o.productName} ×{o.quantity}</p>
                <p className="text-xs text-muted">{o.status}</p>
              </div>
              <Button size="sm" variant="outline" onClick={async () => {
                const next =
                  o.status === "PLANNED" ? "IN_PROGRESS" : o.status === "IN_PROGRESS" ? "QC" : "DONE";
                await fetch("/api/erp/manufacturing", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: o.id, status: next }),
                });
                await load();
              }}>Advance</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
