"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    priceCents: number;
    currency: string;
    billingPeriod: string;
  };
};

export function CartView() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setItems(data.cart?.items ?? []);
      setSubtotalCents(data.subtotalCents ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setQty(itemId: string, quantity: number) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setItems(data.cart?.items ?? []);
      setSubtotalCents(data.subtotalCents ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/orders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      router.push("/portal/invoices");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-muted text-sm">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted">Your cart is empty.</p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4"
          >
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-muted">
                {formatMoney(item.product.priceCents, item.product.currency)}
                {item.product.billingPeriod !== "ONCE"
                  ? ` / ${item.product.billingPeriod.toLowerCase()}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={99}
                disabled={busy}
                value={item.quantity}
                onChange={(e) => setQty(item.id, Number(e.target.value))}
                className="w-16 h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm"
              />
              <p className="text-sm font-medium w-28 text-right">
                {formatMoney(item.product.priceCents * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2">
        <p className="text-muted">Subtotal</p>
        <p className="font-display text-xl font-bold">{formatMoney(subtotalCents)}</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button onClick={checkout} disabled={busy} size="lg">
        {busy ? "Processing…" : "Checkout"}
      </Button>
      <p className="text-xs text-muted">
        Checkout creates an invoice. Pay from Invoices (demo gateway until PayHere/Stripe).
      </p>
    </div>
  );
}
