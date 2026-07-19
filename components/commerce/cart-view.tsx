"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type CartItem = {
  id: string;
  quantity: number;
  metaJson?: string | null;
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
  const [discountCents, setDiscountCents] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [registrantName, setRegistrantName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nicOrBr, setNicOrBr] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

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
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setRegistrantName(d.user.fullName || "");
          setCompanyName(d.user.company || "");
        }
      })
      .catch(() => undefined);
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
      setDiscountCents(0);
      setAppliedCoupon("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyCoupon() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotalCents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      setDiscountCents(data.discountCents);
      setAppliedCoupon(data.code);
    } catch (e) {
      setDiscountCents(0);
      setAppliedCoupon("");
      setError(e instanceof Error ? e.message : "Invalid coupon");
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!acceptTerms) {
      setError("Please accept Terms to continue");
      return;
    }
    if (!registrantName.trim()) {
      setError("Registrant name is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCoupon || undefined,
          acceptTerms: true,
          registrant: {
            registrantName,
            companyName,
            phone,
            address,
            nicOrBr,
            country: "Sri Lanka",
          },
        }),
      });
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

  if (loading) return <p className="text-muted text-sm">Loading cart…</p>;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted">Your cart is empty.</p>
        <Button asChild><Link href="/products">Browse products</Link></Button>
      </div>
    );
  }

  const total = Math.max(0, subtotalCents - discountCents);

  return (
    <div className="space-y-8 max-w-2xl">
      <ul className="space-y-4">
        {items.map((item) => {
          let metaLabel = "";
          try {
            const m = item.metaJson ? JSON.parse(item.metaJson) : null;
            if (m?.domainName) metaLabel = m.domainName;
          } catch { /* ignore */ }
          return (
            <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="font-medium">{item.product.name}</p>
                {metaLabel && <p className="text-xs font-mono text-accent">{metaLabel}</p>}
                <p className="text-sm text-muted">
                  {formatMoney(item.product.priceCents)}
                  {item.product.billingPeriod !== "ONCE" ? ` / ${item.product.billingPeriod.toLowerCase()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={99} disabled={busy} value={item.quantity}
                  onChange={(e) => setQty(item.id, Number(e.target.value))}
                  className="w-16 h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm" />
                <p className="text-sm font-medium w-28 text-right">
                  {formatMoney(item.product.priceCents * item.quantity)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 border border-white/10 rounded-xl p-4">
        <h3 className="font-display font-semibold">Registrant / billing details</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Registrant name *" value={registrantName} onChange={(e) => setRegistrantName(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input placeholder="Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input placeholder="NIC / BR (optional)" value={nicOrBr} onChange={(e) => setNicOrBr(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
          <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)}
            className="sm:col-span-2 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code (e.g. WELCOME10)"
          className="flex-1 h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm" />
        <Button type="button" variant="outline" disabled={busy} onClick={applyCoupon}>Apply</Button>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatMoney(subtotalCents)}</span></div>
        {discountCents > 0 && (
          <div className="flex justify-between text-success"><span>Discount ({appliedCoupon})</span><span>-{formatMoney(discountCents)}</span></div>
        )}
        <div className="flex justify-between font-display text-xl font-bold pt-2"><span>Total</span><span>{formatMoney(total)}</span></div>
      </div>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1" />
        <span>I accept the <Link href="/terms" className="text-accent">Terms</Link> and <Link href="/domain-policy" className="text-accent">Domain Policy</Link></span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button onClick={checkout} disabled={busy} size="lg">
        {busy ? "Processing…" : "Checkout"}
      </Button>
      <p className="text-xs text-muted">Creates an invoice. Pay to auto-provision domains & hosting.</p>
    </div>
  );
}
