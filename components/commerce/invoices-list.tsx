"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/commerce-format";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  order: { orderNumber: string; status: string };
};

export function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInvoices(data.invoices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function payDemo(invoiceId: string) {
    setBusyId(invoiceId);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      setMessage(data.message || "Paid — services activated");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusyId(null);
    }
  }

  async function payPayHere(invoiceId: string) {
    setBusyId(invoiceId);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/payments/payhere/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.mode === "demo") {
        setMessage(data.message);
        await payDemo(invoiceId);
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.checkoutUrl;
      Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading invoices…</p>;
  if (error && invoices.length === 0) return <p className="text-sm text-red-400">{error}</p>;
  if (invoices.length === 0) {
    return <p className="text-muted">No invoices yet. Checkout a cart to generate one.</p>;
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-teal-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {invoices.map((inv) => (
        <div
          key={inv.id}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <p className="font-mono text-sm text-accent">{inv.invoiceNumber}</p>
            <p className="text-sm text-muted mt-1">
              Order {inv.order.orderNumber} · {inv.status}
            </p>
            {inv.dueAt && inv.status !== "PAID" && (
              <p className="text-xs text-muted mt-1">Due {new Date(inv.dueAt).toLocaleDateString()}</p>
            )}
            {inv.paidAt && (
              <p className="text-xs text-teal-400/80 mt-1">Paid {new Date(inv.paidAt).toLocaleString()}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold mr-2">{formatMoney(inv.totalCents, inv.currency)}</p>
            {inv.status !== "PAID" && inv.status !== "VOID" && (
              <>
                <Button size="sm" disabled={busyId === inv.id} onClick={() => payPayHere(inv.id)}>
                  {busyId === inv.id ? "…" : "PayHere"}
                </Button>
                <Button size="sm" variant="outline" disabled={busyId === inv.id} onClick={() => payDemo(inv.id)}>
                  Demo pay
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted">
        Demo pay activates domains/hosting immediately. PayHere uses sandbox/live credentials when configured.
      </p>
    </div>
  );
}
