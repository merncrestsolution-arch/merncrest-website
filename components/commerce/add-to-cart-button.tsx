"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  billingPeriod: string;
};

export function AddToCartButton({ product }: { product: Product }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function add() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Added to cart");
      router.push("/portal/cart");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="font-display text-lg font-semibold">
        {formatMoney(product.priceCents, product.currency)}
        {product.billingPeriod !== "ONCE" && (
          <span className="text-sm font-sans font-normal text-muted">
            {" "}
            / {product.billingPeriod.toLowerCase()}
          </span>
        )}
      </p>
      <Button onClick={add} disabled={busy}>
        {busy ? "Adding…" : "Add to cart"}
      </Button>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}
