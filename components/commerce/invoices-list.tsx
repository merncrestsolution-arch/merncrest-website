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

type BankAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  currency: string;
  purpose: string;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/payments/manual"),
      ]);
      const invData = await invRes.json();
      const payData = await payRes.json();
      if (!invRes.ok) throw new Error(invData.error || "Failed");
      setInvoices(invData.invoices ?? []);
      setAccounts(payData.accounts ?? (payData.bank ? [payData.bank] : []));
      setGatewayEnabled(Boolean(payData.automaticGatewaysEnabled));
      setDemoEnabled(Array.isArray(payData.methods) && payData.methods.includes("DEMO"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onReceiptChange(invoiceId: string, file: File | null) {
    if (!file) {
      setReceipts((r) => {
        const next = { ...r };
        delete next[invoiceId];
        return next;
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Receipt must be an image (PNG/JPG/WebP)");
      return;
    }
    if (file.size > 1_500_000) {
      setError("Receipt image must be under 1.5 MB");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setReceipts((r) => ({ ...r, [invoiceId]: dataUrl }));
  }

  async function submitManual(invoiceId: string) {
    const referenceNumber = (refs[invoiceId] || "").trim();
    const proofImageUrl = receipts[invoiceId];
    if (referenceNumber.length < 3) {
      setError("Enter your bank transfer reference number");
      return;
    }
    if (!proofImageUrl) {
      setError("Upload a screenshot of your bank transfer receipt");
      return;
    }
    setBusyId(invoiceId);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          method: "BANK_TRANSFER",
          referenceNumber,
          proofImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setMessage(data.message || "Submitted for verification");
      if (data.accounts) setAccounts(data.accounts);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusyId(null);
    }
  }

  async function payWithPayHere(invoiceId: string) {
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
      if (!res.ok) throw new Error(data.error || data.message || "PayHere unavailable");

      if (data.mode === "demo" || !data.checkoutUrl || !data.fields) {
        setMessage(
          data.message ||
            "PayHere merchant not configured. Use bank transfer or set PAYHERE_MERCHANT_ID/SECRET."
        );
        setBusyId(null);
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.checkoutUrl;
      for (const [key, value] of Object.entries(data.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "PayHere failed");
      setBusyId(null);
    }
  }

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

  if (loading) return <p className="text-sm text-muted">Loading invoices…</p>;
  if (error && invoices.length === 0) return <p className="text-sm text-red-400">{error}</p>;
  if (invoices.length === 0) {
    return <p className="text-muted">No invoices yet. Checkout a cart to generate one.</p>;
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {accounts.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm space-y-3">
          <p className="font-semibold">Bank transfer details</p>
          <p className="text-xs text-muted">
            Transfer the invoice total, then submit your reference number and receipt screenshot
            below. Services provision automatically after admin verification.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((a) => (
              <div
                key={`${a.bankName}-${a.accountNumber}`}
                className="rounded-lg border border-white/10 p-3 space-y-1"
              >
                <p className="font-medium">{a.bankName}</p>
                <p className="text-xs text-muted">{a.purpose}</p>
                <p className="text-xs text-muted">
                  {a.branch} · {a.currency}
                </p>
                <p>
                  {a.accountName}
                  <br />
                  <span className="font-mono text-accent">{a.accountNumber}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {invoices.map((inv) => (
        <div
          key={inv.id}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-accent">{inv.invoiceNumber}</p>
              <p className="text-sm text-muted mt-1">
                Order {inv.order.orderNumber} · {inv.status}
                {inv.order.status === "PROVISIONING_FAILED" && (
                  <span className="text-amber-400"> · setup in progress</span>
                )}
              </p>
              {inv.dueAt && inv.status !== "PAID" && (
                <p className="text-xs text-muted mt-1">
                  Due {new Date(inv.dueAt).toLocaleDateString()}
                </p>
              )}
              {inv.paidAt && (
                <p className="text-xs text-success/80 mt-1">
                  Paid {new Date(inv.paidAt).toLocaleString()}
                </p>
              )}
            </div>
            <p className="font-semibold">{formatMoney(inv.totalCents, inv.currency)}</p>
          </div>
          {inv.status !== "PAID" && inv.status !== "VOID" && (
            <div className="flex flex-col gap-2">
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Bank transfer reference number *"
                value={refs[inv.id] || ""}
                onChange={(e) => setRefs({ ...refs, [inv.id]: e.target.value })}
              />
              <label className="text-xs text-muted">
                Receipt screenshot *
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm"
                  onChange={(e) => onReceiptChange(inv.id, e.target.files?.[0] || null)}
                />
              </label>
              {receipts[inv.id] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receipts[inv.id]}
                  alt="Receipt preview"
                  className="h-24 w-auto rounded border border-white/10 object-cover"
                />
              )}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                <Button
                  size="sm"
                  disabled={busyId === inv.id}
                  onClick={() => submitManual(inv.id)}
                >
                  {busyId === inv.id ? "…" : "Submit for verification"}
                </Button>
                {gatewayEnabled && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === inv.id}
                    onClick={() => payWithPayHere(inv.id)}
                  >
                    Pay with PayHere
                  </Button>
                )}
                {demoEnabled && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === inv.id}
                    onClick={() => payDemo(inv.id)}
                  >
                    Demo pay
                  </Button>
                )}
                <Button asChild size="sm" variant="ghost">
                  <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer">
                    PDF
                  </a>
                </Button>
              </div>
            </div>
          )}
          {inv.status === "PAID" && (
            <Button asChild size="sm" variant="ghost" className="self-start">
              <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer">
                PDF
              </a>
            </Button>
          )}
        </div>
      ))}
      <p className="text-xs text-muted">
        Bank transfers are verified by MernCrest admin. After approval, services provision
        automatically via provider APIs
        {gatewayEnabled
          ? ". PayHere card payments activate automatically on successful notify."
          : ". Card gateway is disabled (PAYMENT_GATEWAY_ENABLED=false)."}
      </p>
    </div>
  );
}
