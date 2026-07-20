"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Refund = {
  id: string;
  amountCents: number;
  reason: string;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  order: { orderNumber: string };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
};

export function RefundsPanel() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, oRes] = await Promise.all([fetch("/api/refunds"), fetch("/api/orders")]);
      const rData = await rRes.json();
      const oData = await oRes.json();
      if (!rRes.ok) throw new Error(rData.error || "Failed");
      setRefunds(rData.refunds ?? []);
      const eligible = (oData.orders ?? []).filter((o: Order) =>
        ["PAID", "PROCESSING", "PROVISIONING", "PROVISIONING_FAILED", "COMPLETED"].includes(o.status)
      );
      setOrders(eligible);
      setOrderId((prev) => prev || eligible[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId || reason.trim().length < 5) {
      setError("Select an order and enter a reason (min 5 characters)");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage("Refund request submitted — pending admin review");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-8 max-w-2xl">
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="font-display font-semibold">Request a refund</h2>
        <p className="text-sm text-muted">
          Eligible for paid/completed orders. Admin approval required before payout.
        </p>
        <select
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        >
          {orders.length === 0 && <option value="">No eligible orders</option>}
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNumber} · {formatMoney(o.totalCents)} · {o.status}
            </option>
          ))}
        </select>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for refund…"
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}
        <Button type="submit" disabled={busy || orders.length === 0}>
          {busy ? "Submitting…" : "Submit request"}
        </Button>
      </form>

      <div>
        <h2 className="font-display font-semibold mb-3">Your refund requests</h2>
        {refunds.length === 0 ? (
          <p className="text-sm text-muted">No refund requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {refunds.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/10 p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-mono text-sm text-accent">{r.order.orderNumber}</p>
                  <p className="text-sm font-medium">{r.status}</p>
                </div>
                <p className="text-sm mt-1">{formatMoney(r.amountCents)}</p>
                <p className="text-xs text-muted mt-2">{r.reason}</p>
                {r.adminNote && <p className="text-xs text-success/80 mt-1">Admin: {r.adminNote}</p>}
                <p className="text-xs text-muted mt-2">{new Date(r.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
