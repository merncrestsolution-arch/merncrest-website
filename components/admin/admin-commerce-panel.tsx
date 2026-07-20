"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type CommercePayload = {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    lastProvisionError?: string | null;
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
    provisioningFailedCount?: number;
  };
};

const ORDER_FILTERS = [
  { value: "", label: "All" },
  { value: "PROVISIONING_FAILED", label: "Provisioning failed" },
  { value: "PROVISIONING", label: "Provisioning" },
  { value: "PAID", label: "Paid" },
  { value: "WAITING_PAYMENT", label: "Waiting payment" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
] as const;

export function AdminCommercePanel({ view }: { view: "orders" | "billing" | "dashboard" }) {
  const [data, setData] = useState<CommercePayload | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
    fetch(`/api/admin/commerce${q}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [statusFilter]);

  async function reprovision(orderId: string) {
    setBusyId(orderId);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/commerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "reprovision" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Reprovision failed");
      setMessage(d.message || "Done");
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const refreshed = await fetch(`/api/admin/commerce${q}`).then((r) => r.json());
      setData(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (error && !data) return <p className="text-sm text-red-400">{error}</p>;
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
          {
            label: "Provisioning failed",
            value: String(data.stats.provisioningFailedCount ?? 0),
          },
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
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ORDER_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                statusFilter === f.value
                  ? "border-violet-400 bg-violet-500/20"
                  : "border-white/10 text-muted"
              }`}
            >
              {f.label}
              {f.value === "PROVISIONING_FAILED" &&
                (data.stats.provisioningFailedCount ?? 0) > 0 &&
                ` (${data.stats.provisioningFailedCount})`}
            </button>
          ))}
        </div>
        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {data.orders.length === 0 ? (
          <p className="text-muted">No orders match this filter.</p>
        ) : (
          <div className="space-y-3">
            {data.orders.map((o) => (
              <div
                key={o.id}
                className={`rounded-xl border p-4 flex flex-col sm:flex-row justify-between gap-4 ${
                  o.status === "PROVISIONING_FAILED"
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-white/10"
                }`}
              >
                <div>
                  <p className="font-mono text-sm text-accent">{o.orderNumber}</p>
                  <p className="text-sm mt-1">
                    {o.user.fullName} · {o.user.email}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                  </p>
                  {o.lastProvisionError && (
                    <p className="text-xs text-red-300 mt-1">{o.lastProvisionError}</p>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <p className="font-semibold">{formatMoney(o.totalCents, o.currency)}</p>
                  <p className="text-xs text-muted">{o.status}</p>
                  {(o.status === "PROVISIONING_FAILED" ||
                    o.status === "PROVISIONING" ||
                    o.status === "PAID") && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === o.id}
                      onClick={() => reprovision(o.id)}
                    >
                      {busyId === o.id ? "…" : "Retry provision"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
