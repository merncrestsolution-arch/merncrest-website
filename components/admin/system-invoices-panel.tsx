"use client";

import { useCallback, useEffect, useState } from "react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalCents: number;
  paidCents: number;
  user?: { fullName: string; email: string };
};

export function SystemInvoicesPanel() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vat, setVat] = useState(18);
  const [form, setForm] = useState({
    userId: "",
    description: "",
    qty: 1,
    unitCents: 0,
  });
  const [error, setError] = useState("");
  const [pay, setPay] = useState({ invoiceId: "", amountCents: 0, method: "BANK_TRANSFER" });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/invoices");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setInvoices(data.invoices ?? []);
    if (data.vatRatePercent != null) setVat(data.vatRatePercent);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.userId,
        status: "SENT",
        lineItems: [
          {
            description: form.description,
            qty: form.qty,
            unitCents: form.unitCents,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Create failed");
      return;
    }
    setForm({ userId: "", description: "", qty: 1, unitCents: 0 });
    load();
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", ...pay }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Payment failed");
      return;
    }
    setPay({ invoiceId: "", amountCents: 0, method: "BANK_TRANSFER" });
    load();
  }

  return (
    <>
      <h1 className="rlk-welcome">Invoices & payments</h1>
      <p className="text-sm text-[#666] mb-4">
        Sequential org numbering · VAT {vat}% · partial payments with balance checks
      </p>
      {error ? <p className="rlk-login-error mb-3">{error}</p> : null}

      <section className="rlk-section rlk-section-accent-orange mb-4">
        <div className="rlk-section-head">
          <h2>Create invoice</h2>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={create} className="grid gap-3 max-w-xl">
            <input
              className="rlk-input"
              placeholder="Customer userId"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
            />
            <input
              className="rlk-input"
              placeholder="Line description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <input
              className="rlk-input"
              type="number"
              placeholder="Qty"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: Number(e.target.value) || 1 })}
            />
            <input
              className="rlk-input"
              type="number"
              placeholder="Unit price (cents)"
              value={form.unitCents}
              onChange={(e) =>
                setForm({ ...form, unitCents: Number(e.target.value) || 0 })
              }
              required
            />
            <button type="submit" className="rlk-btn-green !w-auto">
              Create & send
            </button>
          </form>
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-green mb-4">
        <div className="rlk-section-head">
          <h2>Record payment</h2>
        </div>
        <div className="rlk-section-body">
          <form onSubmit={recordPayment} className="grid gap-3 max-w-xl">
            <input
              className="rlk-input"
              placeholder="Invoice id"
              value={pay.invoiceId}
              onChange={(e) => setPay({ ...pay, invoiceId: e.target.value })}
              required
            />
            <input
              className="rlk-input"
              type="number"
              placeholder="Amount (cents)"
              value={pay.amountCents}
              onChange={(e) =>
                setPay({ ...pay, amountCents: Number(e.target.value) || 0 })
              }
              required
            />
            <select
              className="rlk-input"
              value={pay.method}
              onChange={(e) => setPay({ ...pay, method: e.target.value })}
            >
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MANUAL">Manual</option>
            </select>
            <button type="submit" className="rlk-btn-green !w-auto">
              Record payment
            </button>
          </form>
        </div>
      </section>

      <section className="rlk-section rlk-section-accent-teal">
        <div className="rlk-section-head">
          <h2>Recent invoices</h2>
        </div>
        <div className="rlk-section-body">
          {invoices.length === 0 ? (
            <p className="rlk-empty">No invoices.</p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id} className="border-b border-[#e0e0e0] py-2 text-sm">
                  <strong>{inv.invoiceNumber}</strong> · {inv.status} ·{" "}
                  {(inv.paidCents / 100).toFixed(0)} / {(inv.totalCents / 100).toFixed(0)} LKR
                  <br />
                  <span className="text-[#666]">
                    {inv.user?.fullName} · {inv.user?.email} · id {inv.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
