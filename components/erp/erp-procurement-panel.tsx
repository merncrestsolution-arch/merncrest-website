"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

export function ErpProcurementPanel() {
  const [vendors, setVendors] = useState<{ id: string; vendorCode: string; name: string; status: string }[]>([]);
  const [orders, setOrders] = useState<
    { id: string; poNumber: string; description: string; amountCents: number; status: string; vendor?: { name: string } | null }[]
  >([]);
  const [vendorName, setVendorName] = useState("");
  const [poDesc, setPoDesc] = useState("");
  const [amount, setAmount] = useState(500000);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/procurement");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setVendors(data.vendors ?? []);
      setOrders(data.orders ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        <form
          className="rounded-xl border border-white/10 p-4 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/erp/procurement", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "vendor", name: vendorName }),
            });
            setVendorName("");
            await load();
          }}
        >
          <h3 className="font-semibold text-sm">Add vendor</h3>
          <input required value={vendorName} onChange={(e) => setVendorName(e.target.value)}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" placeholder="Vendor name" />
          <Button type="submit" size="sm">Save vendor</Button>
        </form>
        <form
          className="rounded-xl border border-white/10 p-4 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/erp/procurement", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: poDesc,
                amountCents: amount,
                vendorId: vendors[0]?.id,
              }),
            });
            setPoDesc("");
            await load();
          }}
        >
          <h3 className="font-semibold text-sm">Create purchase order</h3>
          <input required value={poDesc} onChange={(e) => setPoDesc(e.target.value)}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" placeholder="Description" />
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <Button type="submit" size="sm">Submit PO</Button>
        </form>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <ul className="space-y-2">
          <h3 className="font-display font-semibold text-sm">Vendors</h3>
          {vendors.map((v) => (
            <li key={v.id} className="text-sm border border-white/10 rounded-lg p-3">
              <span className="font-mono text-xs text-accent">{v.vendorCode}</span> · {v.name}
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          <h3 className="font-display font-semibold text-sm">Purchase orders</h3>
          {orders.map((o) => (
            <li key={o.id} className="text-sm border border-white/10 rounded-lg p-3 flex justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-accent">{o.poNumber}</p>
                <p>{o.description}</p>
                <p className="text-xs text-muted">{o.vendor?.name || "—"} · {o.status}</p>
              </div>
              <div className="text-right">
                <p>{formatMoney(o.amountCents)}</p>
                {o.status !== "RECEIVED" && (
                  <Button size="sm" variant="outline" className="mt-1" onClick={async () => {
                    await fetch("/api/erp/procurement", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: o.id,
                        status: o.status === "SUBMITTED" ? "APPROVED" : o.status === "APPROVED" ? "ORDERED" : "RECEIVED",
                      }),
                    });
                    await load();
                  }}>Advance</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
