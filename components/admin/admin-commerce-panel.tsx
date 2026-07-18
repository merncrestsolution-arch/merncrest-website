"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/commerce-format";

type CommercePayload = {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    user: { email: string; fullName: string };
    items: { productName: string; quantity: number }[];
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    totalCents: number;
    currency: string;
    user: { email: string; fullName: string };
    order: { orderNumber: string };
  }>;
  stats: {
    revenueCents: number;
    orderCount: number;
    openInvoices: number;
    customerCount: number;
    domainCount?: number;
    hostingCount?: number;
  };
};

export function AdminCommercePanel({ view }: { view: "orders" | "billing" | "dashboard" }) {
  const [data, setData] = useState<CommercePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/commerce")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading…</p>;

  if (view === "dashboard") {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Revenue", value: formatMoney(data.stats.revenueCents) },
          { label: "Recent orders", value: String(data.stats.orderCount) },
          { label: "Open invoices", value: String(data.stats.openInvoices) },
          { label: "Customers", value: String(data.stats.customerCount) },
          { label: "Domains", value: String(data.stats.domainCount ?? 0) },
          { label: "Hosting", value: String(data.stats.hostingCount ?? 0) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-mono uppercase tracking-wider text-muted">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    );
  }

  if (view === "orders") {
    if (data.orders.length === 0) {
      return <p className="text-muted">No orders yet.</p>;
    }
    return (
      <div className="space-y-3">
        {data.orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-white/10 p-4 flex justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-accent">{o.orderNumber}</p>
              <p className="text-sm mt-1">
                {o.user.fullName} · {o.user.email}
              </p>
              <p className="text-xs text-muted mt-1">
                {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold">{formatMoney(o.totalCents, o.currency)}</p>
              <p className="text-xs text-muted">{o.status}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.invoices.length === 0) {
    return <p className="text-muted">No invoices yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.invoices.map((inv) => (
        <div key={inv.id} className="rounded-xl border border-white/10 p-4 flex justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-accent">{inv.invoiceNumber}</p>
            <p className="text-sm mt-1">
              {inv.user.fullName} · {inv.order.orderNumber}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold">{formatMoney(inv.totalCents, inv.currency)}</p>
            <p className="text-xs text-muted">{inv.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
