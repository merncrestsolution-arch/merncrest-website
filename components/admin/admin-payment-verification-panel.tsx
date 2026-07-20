"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type PendingPayment = {
  id: string;
  method: string;
  status: string;
  amountCents: number;
  currency: string;
  proofNote: string | null;
  referenceNumber: string | null;
  proofImageUrl: string | null;
  createdAt: string;
  slaBreached?: boolean;
  waitingHours?: number;
  user: { fullName: string; email: string };
  invoice: { invoiceNumber: string; id: string } | null;
  order: {
    orderNumber: string;
    totalCents: number;
    currency?: string;
    items?: { productName: string; quantity: number; unitPriceCents: number }[];
  };
};

/** Pending Verification queue — oldest first, receipt + ref + order on one screen */
export function AdminPaymentVerificationPanel() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [slaHours, setSlaHours] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPayments(data.payments ?? []);
      if (data.slaHours) setSlaHours(data.slaHours);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(paymentId: string, action: "approve" | "reject") {
    setBusy(paymentId);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMessage(data.message || "Done");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading pending payments…</p>;

  const breached = payments.filter((p) => p.slaBreached).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Pending Verification</h2>
        <p className="text-sm text-muted mt-1">
          Oldest first. Approve to confirm payment and start automated provisioning. SLA:{" "}
          {slaHours}h
          {breached > 0 && (
            <span className="ml-2 text-amber-400 font-medium">
              · {breached} over SLA
            </span>
          )}
        </p>
      </div>
      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {payments.length === 0 && (
        <p className="text-sm text-muted">No payments awaiting verification.</p>
      )}
      {payments.map((p) => (
        <div
          key={p.id}
          className={`rounded-xl border p-4 space-y-3 ${
            p.slaBreached
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{p.user.fullName}</p>
                {p.slaBreached && (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    SLA &gt; {slaHours}h ({p.waitingHours}h)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">{p.user.email}</p>
              <p className="text-sm mt-1">
                {p.invoice?.invoiceNumber} · Order {p.order.orderNumber}
              </p>
              <p className="text-xs text-muted">
                {p.method} · {formatMoney(p.amountCents, p.currency)} · submitted{" "}
                {new Date(p.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-violet-300/90 mt-1">
                Ref: <span className="font-mono">{p.referenceNumber || p.proofNote || "—"}</span>
              </p>
              {p.order.items && p.order.items.length > 0 && (
                <p className="text-xs text-muted mt-1">
                  {p.order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                </p>
              )}
            </div>
            {p.proofImageUrl && (
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href={p.proofImageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={p.proofImageUrl}
                    alt="Transfer receipt"
                    className="h-32 w-auto max-w-[220px] rounded-lg border border-white/10 object-cover"
                  />
                </a>
                <p className="text-[10px] text-muted mt-1 text-center">Receipt</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={busy === p.id} onClick={() => act(p.id, "approve")}>
              {busy === p.id ? "…" : "Approve & provision"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy === p.id}
              onClick={() => act(p.id, "reject")}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
