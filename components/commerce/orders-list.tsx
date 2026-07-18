"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { productName: string; quantity: number }[];
  invoice?: { id: string; invoiceNumber: string; status: string } | null;
};

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setOrders(d.orders ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading orders…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (orders.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted">No orders yet.</p>
        <Button asChild variant="outline">
          <Link href="/products">Shop products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div
          key={o.id}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <p className="font-mono text-sm text-accent">{o.orderNumber}</p>
            <p className="text-sm text-muted mt-1">
              {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
            </p>
            <p className="text-xs text-muted mt-1">
              {new Date(o.createdAt).toLocaleString()} · {o.status}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatMoney(o.totalCents, o.currency)}</p>
            {o.invoice && (
              <Link href="/portal/invoices" className="text-xs text-accent hover:underline">
                {o.invoice.invoiceNumber}
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
