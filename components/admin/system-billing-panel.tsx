"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { CustomerPicker, type PickedCustomer } from "@/components/admin/customer-picker";
import {
  FileText,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

const INPUT =
  "w-full rounded-lg border border-[var(--sp-outline)] bg-white px-3 py-2 text-sm text-[var(--sp-on)] outline-none focus:border-[var(--sp-primary)] focus:ring-2 focus:ring-[var(--stitch-glow)]";

type Tab = "overview" | "clients" | "quotations" | "invoices" | "receipts";

type LineItem = { description: string; qty: number; unitLkr: string };

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  customerCode?: string | null;
  counts: { orders: number; invoices: number };
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalCents: number;
  paidCents: number;
  user?: { fullName: string; email: string };
};

type PaymentRow = {
  id: string;
  amountCents: number;
  method: string;
  createdAt: string;
  user: { fullName: string; email: string };
  invoice?: { invoiceNumber: string } | null;
};

function emptyLine(): LineItem {
  return { description: "", qty: 1, unitLkr: "" };
}

function lkrToCents(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

export function SystemBillingPanel({ initialTab = "overview" }: { initialTab?: Tab }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabFromUrl = searchParams.get("tab") as Tab | null;
  const tabFromPath: Tab | null = pathname.endsWith("/clients")
    ? "clients"
    : pathname.endsWith("/quotations")
      ? "quotations"
      : pathname.endsWith("/invoices")
        ? "invoices"
        : pathname.endsWith("/receipts")
          ? "receipts"
          : pathname.endsWith("/billing")
            ? "overview"
            : null;
  const resolvedInitial =
    tabFromPath ??
    (tabFromUrl &&
    ["overview", "clients", "quotations", "invoices", "receipts"].includes(tabFromUrl)
      ? tabFromUrl
      : initialTab);
  const [tab, setTab] = useState<Tab>(resolvedInitial);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentInvoices, setRecentInvoices] = useState<InvoiceRow[]>([]);
  const [clients, setClients] = useState<CustomerRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [receipts, setReceipts] = useState<PaymentRow[]>([]);
  const [clientQ, setClientQ] = useState("");
  const [showCreateClient, setShowCreateClient] = useState(true);
  const [clientForm, setClientForm] = useState({
    fullName: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    sendWelcomeEmail: true,
  });

  const [customer, setCustomer] = useState<PickedCustomer | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [discountLkr, setDiscountLkr] = useState("0");
  const [taxLkr, setTaxLkr] = useState("0");
  const [dueDays, setDueDays] = useState("14");
  const [payForm, setPayForm] = useState({ invoiceId: "", amountLkr: "", method: "BANK_TRANSFER", ref: "" });

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/admin/billing");
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed");
    setStats(d.stats ?? {});
    setRecentInvoices(d.recentInvoices ?? []);
  }, []);

  const loadClients = useCallback(async () => {
    const params = new URLSearchParams();
    if (clientQ) params.set("q", clientQ);
    const res = await fetch(`/api/admin/customers?${params}`);
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed");
    setClients(d.customers ?? []);
  }, [clientQ]);

  const loadInvoices = useCallback(async () => {
    const res = await fetch("/api/admin/invoices");
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed");
    setInvoices(d.invoices ?? []);
  }, []);

  const loadReceipts = useCallback(async () => {
    const res = await fetch("/api/admin/billing?view=receipts");
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Failed");
    setReceipts(d.payments ?? []);
  }, []);

  useEffect(() => {
    setTab(resolvedInitial);
  }, [resolvedInitial]);

  useEffect(() => {
    setError("");
    if (tab === "overview") loadOverview().catch((e) => setError(e.message));
    if (tab === "clients") loadClients().catch((e) => setError(e.message));
    if (tab === "invoices") loadInvoices().catch((e) => setError(e.message));
    if (tab === "receipts") loadReceipts().catch((e) => setError(e.message));
  }, [tab, loadOverview, loadClients, loadInvoices, loadReceipts]);

  useEffect(() => {
    if (tab !== "clients") return;
    const t = setTimeout(() => loadClients().catch((e) => setError(e.message)), 250);
    return () => clearTimeout(t);
  }, [clientQ, tab, loadClients]);

  function pickClient(c: CustomerRow) {
    setCustomer({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      company: c.company,
      customerCode: c.customerCode,
    });
    setManualName(c.fullName);
    setManualEmail(c.email);
    setManualCompany(c.company || "");
  }

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: clientForm.fullName,
          email: clientForm.email,
          company: clientForm.company || undefined,
          phone: clientForm.phone || undefined,
          password: clientForm.password || undefined,
          sendWelcomeEmail: clientForm.sendWelcomeEmail,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setMsg(d.message || "Client created");
      setCustomer({
        id: d.customer.id,
        fullName: d.customer.fullName,
        email: d.customer.email,
        company: d.customer.company,
        customerCode: d.customer.customerCode,
      });
      setClientForm({
        fullName: "",
        email: "",
        company: "",
        phone: "",
        password: "",
        sendWelcomeEmail: true,
      });
      setShowCreateClient(false);
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createManualQuotation(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const name = customer?.fullName || manualName;
      const email = customer?.email || manualEmail;
      if (!name || !email) throw new Error("Customer name and email required");
      const items = lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description.trim(),
          quantity: l.qty,
          unitPriceCents: lkrToCents(l.unitLkr),
        }));
      if (!items.length) throw new Error("Add at least one line item");
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customer?.id,
          customerName: name,
          customerEmail: email,
          company: manualCompany || customer?.company,
          items,
          discountCents: lkrToCents(discountLkr),
          taxCents: lkrToCents(taxLkr),
          validDays: Number(dueDays) || 14,
          notes: "[Manual quotation]",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setMsg(`Quotation ${d.quotation.quoteNumber} created`);
      setLines([emptyLine()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) {
      setError("Select a registered client to create an invoice");
      return;
    }
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const lineItems = lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description.trim(),
          qty: l.qty,
          unitCents: lkrToCents(l.unitLkr),
        }));
      if (!lineItems.length) throw new Error("Add at least one line item");
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customer.id,
          lineItems,
          dueDays: Number(dueDays) || 14,
          status: "SENT",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setMsg(`Invoice ${d.invoice.invoiceNumber} created and sent`);
      setLines([emptyLine()]);
      loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recordPayment",
          invoiceId: payForm.invoiceId,
          amountCents: lkrToCents(payForm.amountLkr),
          method: payForm.method,
          referenceNumber: payForm.ref || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setMsg(d.message || "Payment recorded");
      setPayForm({ invoiceId: "", amountLkr: "", method: "BANK_TRANSFER", ref: "" });
      loadInvoices();
      loadReceipts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Users; href: string }[] = [
    { id: "overview", label: "Overview", icon: Wallet, href: "/staff/billing" },
    { id: "clients", label: "Clients", icon: Users, href: "/staff/clients" },
    { id: "quotations", label: "Quotations", icon: FileText, href: "/staff/billing?tab=quotations" },
    { id: "invoices", label: "Invoices", icon: Receipt, href: "/staff/invoices" },
    { id: "receipts", label: "Receipts", icon: Receipt, href: "/staff/receipts" },
  ];

  const lineItemsForm = (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Line items</p>
        <button type="button" className="stitch-btn-sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
          <Plus className="h-3 w-3 inline mr-1" /> Add
        </button>
      </div>
      {lines.map((line, idx) => (
        <div key={idx} className="grid sm:grid-cols-12 gap-2">
          <input
            className={`${INPUT} sm:col-span-6`}
            placeholder="Description"
            value={line.description}
            onChange={(e) =>
              setLines((p) => p.map((row, i) => (i === idx ? { ...row, description: e.target.value } : row)))
            }
          />
          <input
            className={`${INPUT} sm:col-span-2`}
            type="number"
            min={1}
            value={line.qty}
            onChange={(e) =>
              setLines((p) => p.map((row, i) => (i === idx ? { ...row, qty: Number(e.target.value) || 1 } : row)))
            }
          />
          <input
            className={`${INPUT} sm:col-span-3`}
            placeholder="Unit LKR"
            value={line.unitLkr}
            onChange={(e) =>
              setLines((p) => p.map((row, i) => (i === idx ? { ...row, unitLkr: e.target.value } : row)))
            }
          />
          {lines.length > 1 ? (
            <button
              type="button"
              className="sm:col-span-1 text-red-400 p-2"
              onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <h1 className="stitch-page-title">Billing Management</h1>
      <p className="stitch-page-sub !mb-5">
        Manual quotations · invoices · receipts · client billing — all in one place.
      </p>

      {error ? <p className="stitch-auth-error !mb-4">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-500 !mb-4">{msg}</p> : null}

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-[var(--stitch-primary-soft)] text-[var(--stitch-primary)] border border-[var(--stitch-primary)]/30"
                  : "border border-[var(--sp-outline)] text-[var(--sp-muted)] hover:text-[var(--sp-on)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Clients", value: stats.customers ?? 0 },
              { label: "Pending quotes", value: stats.pendingQuotes ?? 0 },
              { label: "Open invoices", value: stats.openInvoices ?? 0 },
              { label: "Revenue collected", value: formatMoney(stats.revenueCents ?? 0) },
            ].map((c) => (
              <div key={c.label} className="stitch-card">
                <p className="text-xs uppercase tracking-wide text-muted">{c.label}</p>
                <p className="font-display text-2xl font-bold mt-2">{c.value}</p>
              </div>
            ))}
          </div>
          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <h3>Recent invoices</h3>
              <Link href="/staff/invoices" className="stitch-btn-sm">View all</Link>
            </div>
            <div className="stitch-section-body overflow-x-auto">
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                      <td>{inv.user?.fullName}</td>
                      <td><span className="stitch-chip stitch-chip-violet text-[10px]">{inv.status}</span></td>
                      <td>{formatMoney(inv.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "clients" && (
        <div className="grid lg:grid-cols-5 gap-5">
          <section className="stitch-section-card lg:col-span-2">
            <div className="stitch-section-head">
              <h3>Create client</h3>
              <button
                type="button"
                className="stitch-btn-sm"
                onClick={() => setShowCreateClient((v) => !v)}
              >
                {showCreateClient ? "Hide" : "New client"}
              </button>
            </div>
            <div className="stitch-section-body">
              {showCreateClient ? (
                <form onSubmit={createClient} className="space-y-3">
                  <input
                    className={INPUT}
                    placeholder="Full name *"
                    value={clientForm.fullName}
                    onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
                    required
                  />
                  <input
                    className={INPUT}
                    type="email"
                    placeholder="Email *"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    required
                  />
                  <input
                    className={INPUT}
                    placeholder="Company"
                    value={clientForm.company}
                    onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                  />
                  <input
                    className={INPUT}
                    placeholder="Phone / WhatsApp"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  />
                  <input
                    className={INPUT}
                    type="password"
                    placeholder="Password (optional — auto-generated if blank)"
                    value={clientForm.password}
                    onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={clientForm.sendWelcomeEmail}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, sendWelcomeEmail: e.target.checked })
                      }
                    />
                    Email portal login details to client
                  </label>
                  <button type="submit" className="stitch-btn stitch-btn-primary w-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Create client"}
                  </button>
                  <p className="text-xs text-muted">
                    Creates a portal account with customer code, CRM lead sync, and optional welcome email.
                  </p>
                </form>
              ) : (
                <p className="text-sm text-muted">
                  Register a new client before creating invoices. Quotations can also use walk-in email
                  without an account.
                </p>
              )}
              {customer ? (
                <div className="mt-4 rounded-lg border border-[var(--stitch-primary)]/30 bg-[var(--stitch-primary-soft)] px-3 py-2 text-sm">
                  <p className="text-xs uppercase tracking-wide text-[var(--stitch-primary)] mb-1">Selected client</p>
                  <p className="font-medium">{customer.fullName}</p>
                  <p className="text-xs text-muted">{customer.email}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="stitch-btn-sm" onClick={() => setTab("quotations")}>
                      Create quote
                    </button>
                    <button type="button" className="stitch-btn-sm" onClick={() => setTab("invoices")}>
                      Create invoice
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="stitch-section-card lg:col-span-3">
            <div className="stitch-section-head">
              <h3>All clients</h3>
              <Link href="/admin/customers" className="stitch-btn-sm">Full customer 360</Link>
            </div>
            <div className="stitch-section-body space-y-4">
              <input
                className={INPUT}
                placeholder="Search clients…"
                value={clientQ}
                onChange={(e) => setClientQ(e.target.value)}
              />
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Code</th>
                    <th>Orders</th>
                    <th>Invoices</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="block font-medium">{c.fullName}</span>
                        <span className="text-xs text-muted">{c.email}</span>
                      </td>
                      <td className="font-mono text-xs">{c.customerCode || "—"}</td>
                      <td>{c.counts.orders}</td>
                      <td>{c.counts.invoices}</td>
                      <td className="space-x-2 whitespace-nowrap">
                        <button type="button" className="stitch-btn-sm" onClick={() => pickClient(c)}>
                          Select
                        </button>
                        <button
                          type="button"
                          className="stitch-btn-sm"
                          onClick={() => {
                            pickClient(c);
                            setTab("invoices");
                          }}
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "quotations" && (
        <div className="grid lg:grid-cols-5 gap-5">
          <section className="stitch-section-card lg:col-span-2">
            <div className="stitch-section-head"><h3>Create manual quotation</h3></div>
            <div className="stitch-section-body">
              <form onSubmit={createManualQuotation} className="space-y-4">
                <CustomerPicker value={customer} onChange={(c) => {
                  setCustomer(c);
                  if (c) {
                    setManualName(c.fullName);
                    setManualEmail(c.email);
                    setManualCompany(c.company || "");
                  }
                }} />
                {!customer && (
                  <div className="grid gap-3">
                    <input className={INPUT} placeholder="Customer name *" value={manualName} onChange={(e) => setManualName(e.target.value)} required />
                    <input className={INPUT} type="email" placeholder="Email *" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} required />
                    <input className={INPUT} placeholder="Company" value={manualCompany} onChange={(e) => setManualCompany(e.target.value)} />
                  </div>
                )}
                {lineItemsForm}
                <div className="grid grid-cols-3 gap-3">
                  <input className={INPUT} placeholder="Discount LKR" value={discountLkr} onChange={(e) => setDiscountLkr(e.target.value)} />
                  <input className={INPUT} placeholder="Tax LKR" value={taxLkr} onChange={(e) => setTaxLkr(e.target.value)} />
                  <input className={INPUT} type="number" placeholder="Valid days" value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
                </div>
                <button type="submit" className="stitch-btn stitch-btn-primary" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Create quotation"}
                </button>
              </form>
            </div>
          </section>
          <section className="stitch-section-card lg:col-span-3">
            <div className="stitch-section-head">
              <h3>Review & send</h3>
              <Link href="/staff/quotations" className="stitch-btn-sm">Open quotations workspace</Link>
            </div>
            <div className="stitch-section-body text-sm text-muted space-y-3">
              <p>After creating a quotation, open the quotations workspace to edit pricing, verify details, and email the PDF to the client.</p>
              <p>Auto-generated quotes from website requests appear as <strong>Pending review</strong>.</p>
            </div>
          </section>
        </div>
      )}

      {tab === "invoices" && (
        <div className="grid lg:grid-cols-5 gap-5">
          <section className="stitch-section-card lg:col-span-2">
            <div className="stitch-section-head"><h3>Create invoice</h3></div>
            <div className="stitch-section-body">
              <form onSubmit={createInvoice} className="space-y-4">
                <CustomerPicker value={customer} onChange={setCustomer} />
                <p className="text-xs text-muted">Invoices require a registered portal client.</p>
                {lineItemsForm}
                <input className={INPUT} type="number" placeholder="Due in days" value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
                <button type="submit" className="stitch-btn stitch-btn-primary" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Create & send invoice"}
                </button>
              </form>
            </div>
          </section>
          <section className="stitch-section-card lg:col-span-3 space-y-4">
            <div className="stitch-section-head"><h3>All invoices</h3></div>
            <div className="stitch-section-body overflow-x-auto">
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                      <td>{inv.user?.fullName}</td>
                      <td>{formatMoney(inv.paidCents)} / {formatMoney(inv.totalCents)}</td>
                      <td><span className="stitch-chip text-[10px]">{inv.status}</span></td>
                      <td>
                        <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="stitch-btn-sm">PDF</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="stitch-section-head !mt-6"><h3>Record payment</h3></div>
            <div className="stitch-section-body">
              <form onSubmit={recordPayment} className="grid sm:grid-cols-2 gap-3">
                <select className={INPUT} value={payForm.invoiceId} onChange={(e) => setPayForm({ ...payForm, invoiceId: e.target.value })} required>
                  <option value="">Select invoice…</option>
                  {invoices.filter((i) => i.status !== "PAID").map((i) => (
                    <option key={i.id} value={i.id}>{i.invoiceNumber} — {i.user?.fullName}</option>
                  ))}
                </select>
                <input className={INPUT} placeholder="Amount LKR" value={payForm.amountLkr} onChange={(e) => setPayForm({ ...payForm, amountLkr: e.target.value })} required />
                <select className={INPUT} value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MANUAL">Manual</option>
                </select>
                <input className={INPUT} placeholder="Reference #" value={payForm.ref} onChange={(e) => setPayForm({ ...payForm, ref: e.target.value })} />
                <button type="submit" className="stitch-btn sm:col-span-2" disabled={busy}>Record payment & generate receipt</button>
              </form>
            </div>
          </section>
        </div>
      )}

      {tab === "receipts" && (
        <section className="stitch-section-card">
          <div className="stitch-section-head"><h3>Payment receipts</h3></div>
          <div className="stitch-section-body overflow-x-auto">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>{p.user.fullName}</td>
                    <td>{p.invoice?.invoiceNumber || "—"}</td>
                    <td>{formatMoney(p.amountCents)}</td>
                    <td>{p.method.replace(/_/g, " ")}</td>
                    <td>
                      <a href={`/api/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="stitch-btn-sm">Download PDF</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
