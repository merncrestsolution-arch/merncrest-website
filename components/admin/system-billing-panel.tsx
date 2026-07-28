"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
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
  "w-full rounded-lg border border-[var(--sp-outline)] bg-white px-3 py-2.5 text-sm text-[var(--sp-on)] outline-none focus:border-[var(--sp-primary)] focus:ring-2 focus:ring-[var(--stitch-glow)]";

const FIELD_LABEL = "block text-sm font-medium text-[var(--sp-on)] mb-1.5";
const FIELD_HINT = "text-xs text-[var(--sp-muted)] leading-relaxed";

type Tab = "overview" | "clients" | "quotations" | "invoices" | "receipts";

type LineItem = { description: string; qty: number; unitLkr: string };

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  customerCode?: string | null;
  counts: { orders: number; invoices: number };
  billing?: {
    invoicedCents: number;
    paidCents: number;
    balanceCents: number;
    invoiceCount: number;
  };
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalCents: number;
  paidCents: number;
  balanceCents?: number;
  user?: { fullName: string; email: string };
};

type PaymentRow = {
  id: string;
  receiptNumber?: string | null;
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
  const cleaned = v.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

function centsToLkrInput(cents: number) {
  if (!cents) return "";
  return (cents / 100).toString();
}

function validateBillingLines(lines: LineItem[]) {
  const filled = lines.filter((l) => l.description.trim());
  if (!filled.length) {
    return "Add at least one line item with a description";
  }
  for (const line of filled) {
    if (!line.unitLkr.trim() || lkrToCents(line.unitLkr) <= 0) {
      return `Enter a unit price (LKR) for "${line.description.trim()}"`;
    }
  }
  return null;
}

function estimateBillingPreview(
  lines: LineItem[],
  opts: { discountLkr: string; taxLkr: string; vatPercent: string }
) {
  const lineSubtotal = lines
    .filter((l) => l.description.trim())
    .reduce((sum, l) => sum + l.qty * lkrToCents(l.unitLkr), 0);
  const manualTax = opts.taxLkr.trim() ? lkrToCents(opts.taxLkr) : undefined;
  const vatRate = Number(opts.vatPercent);
  return calcBillingTotals({
    lineSubtotalCents: lineSubtotal,
    discountCents: lkrToCents(opts.discountLkr),
    taxCents: manualTax,
    vatRatePercent: Number.isFinite(vatRate) ? vatRate : 18,
  });
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
  const [discountLkr, setDiscountLkr] = useState("");
  const [taxLkr, setTaxLkr] = useState("");
  const [vatPercent, setVatPercent] = useState("18");
  const [invoiceNotes, setInvoiceNotes] = useState("");
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
    if (d.vatRatePercent != null) setVatPercent(String(d.vatRatePercent));
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
    if (tab === "clients" || tab === "invoices" || tab === "quotations") {
      loadClients().catch((e) => setError(e.message));
    }
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
      const lineError = validateBillingLines(lines);
      if (lineError) throw new Error(lineError);
      const items = lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description.trim(),
          quantity: l.qty,
          unitPriceCents: lkrToCents(l.unitLkr),
        }));
      const preview = estimateBillingPreview(lines, { discountLkr, taxLkr, vatPercent });
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customer?.id,
          customerName: name,
          customerEmail: email,
          company: manualCompany || customer?.company,
          items,
          discountCents: preview.discountCents,
          taxCents: preview.taxCents,
          vatRatePercent: preview.vatRatePercent,
          validDays: Number(dueDays) || 14,
          notes: invoiceNotes.trim() || "[Manual quotation]",
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
      const lineError = validateBillingLines(lines);
      if (lineError) throw new Error(lineError);
      const preview = estimateBillingPreview(lines, { discountLkr, taxLkr, vatPercent });
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customer.id,
          lineItems,
          dueDays: Number(dueDays) || 14,
          status: "SENT",
          discountCents: preview.discountCents,
          taxCents: taxLkr.trim() ? preview.taxCents : undefined,
          vatRatePercent: preview.vatRatePercent,
          notes: invoiceNotes.trim() || undefined,
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
    if (!payForm.invoiceId) {
      setError("Select an invoice to record payment against");
      return;
    }
    const amountCents = lkrToCents(payForm.amountLkr);
    if (amountCents <= 0) {
      setError("Enter a payment amount greater than zero (LKR)");
      return;
    }
    const invoice = invoices.find((i) => i.id === payForm.invoiceId);
    const balance = invoice
      ? invoice.balanceCents ?? Math.max(0, invoice.totalCents - invoice.paidCents)
      : 0;
    if (invoice && balance <= 0) {
      setError("This invoice has no balance due — create a new invoice or check totals");
      return;
    }
    if (invoice && amountCents > balance) {
      setError(`Amount exceeds balance due (${formatMoney(balance)})`);
      return;
    }
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
          amountCents,
          method: payForm.method,
          referenceNumber: payForm.ref || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to record payment");
      setMsg(d.message || "Payment recorded — receipt available under Receipts");
      setPayForm({ invoiceId: "", amountLkr: "", method: "BANK_TRANSFER", ref: "" });
      loadInvoices();
      loadReceipts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setBusy(false);
    }
  }

  const payableInvoices = invoices.filter((i) => {
    if (i.status === "PAID" || i.status === "VOID" || i.status === "CANCELLED") return false;
    const balance = i.balanceCents ?? Math.max(0, i.totalCents - i.paidCents);
    return i.totalCents > 0 && balance > 0;
  });

  function selectInvoiceForPayment(invoiceId: string) {
    const inv = invoices.find((i) => i.id === invoiceId);
    const balance = inv
      ? inv.balanceCents ?? Math.max(0, inv.totalCents - inv.paidCents)
      : 0;
    setPayForm({
      ...payForm,
      invoiceId,
      amountLkr: balance > 0 ? centsToLkrInput(balance) : "",
    });
  }

  const tabs: { id: Tab; label: string; icon: typeof Users; href: string }[] = [
    { id: "overview", label: "Overview", icon: Wallet, href: "/staff/billing" },
    { id: "clients", label: "Clients", icon: Users, href: "/staff/clients" },
    { id: "quotations", label: "Quotations", icon: FileText, href: "/staff/billing?tab=quotations" },
    { id: "invoices", label: "Invoices", icon: Receipt, href: "/staff/invoices" },
    { id: "receipts", label: "Receipts", icon: Receipt, href: "/staff/receipts" },
  ];

  const lineItemsForm = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--sp-on)]">Line items</p>
          <p className={FIELD_HINT}>Add each service or product with a unit price in LKR.</p>
        </div>
        <button
          type="button"
          className="stitch-btn-sm shrink-0"
          onClick={() => setLines((p) => [...p, emptyLine()])}
        >
          <Plus className="h-3.5 w-3.5 inline mr-1" /> Add line
        </button>
      </div>
      <div className="space-y-3">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[var(--sp-outline)] bg-[var(--stitch-surface-low,#f8f9fb)] p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--sp-muted)]">
                Item {idx + 1}
              </span>
              {lines.length > 1 ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              ) : null}
            </div>
            <label className="block">
              <span className={FIELD_LABEL}>Description</span>
              <input
                className={INPUT}
                placeholder="e.g. Website development, hosting renewal…"
                value={line.description}
                onChange={(e) =>
                  setLines((p) =>
                    p.map((row, i) => (i === idx ? { ...row, description: e.target.value } : row))
                  )
                }
                required
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className={FIELD_LABEL}>Quantity</span>
                <input
                  className={INPUT}
                  type="number"
                  min={1}
                  value={line.qty}
                  onChange={(e) =>
                    setLines((p) =>
                      p.map((row, i) => (i === idx ? { ...row, qty: Number(e.target.value) || 1 } : row))
                    )
                  }
                />
              </label>
              <label className="block">
                <span className={FIELD_LABEL}>Unit price (LKR)</span>
                <input
                  className={INPUT}
                  placeholder="e.g. 50000"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={line.unitLkr}
                  onChange={(e) =>
                    setLines((p) =>
                      p.map((row, i) => (i === idx ? { ...row, unitLkr: e.target.value } : row))
                    )
                  }
                  required
                />
              </label>
            </div>
            {line.description.trim() && line.unitLkr.trim() ? (
              <p className="text-xs text-[var(--sp-muted)]">
                Line total:{" "}
                <strong className="text-[var(--sp-on)]">
                  {formatMoney(line.qty * lkrToCents(line.unitLkr))}
                </strong>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  const billingPreview = estimateBillingPreview(lines, { discountLkr, taxLkr, vatPercent });

  const billingTermsFields = (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[var(--sp-on)]">Pricing & terms</p>
        <p className={FIELD_HINT}>Adjust discount, tax, and payment due date before sending.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={FIELD_LABEL}>Discount (LKR)</span>
          <input
            className={INPUT}
            type="number"
            min={0}
            step={0.01}
            placeholder="0"
            value={discountLkr}
            onChange={(e) => setDiscountLkr(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>VAT %</span>
          <input
            className={INPUT}
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={vatPercent}
            onChange={(e) => setVatPercent(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Tax (LKR)</span>
          <input
            className={INPUT}
            type="number"
            min={0}
            step={0.01}
            placeholder="Auto from VAT %"
            value={taxLkr}
            onChange={(e) => setTaxLkr(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={FIELD_LABEL}>Due in (days)</span>
          <input
            className={INPUT}
            type="number"
            min={1}
            placeholder="14"
            value={dueDays}
            onChange={(e) => setDueDays(e.target.value)}
          />
        </label>
      </div>
      {tab === "invoices" ? (
        <label className="block">
          <span className={FIELD_LABEL}>Notes (optional)</span>
          <textarea
            className={`${INPUT} min-h-[80px] resize-y`}
            placeholder="Payment instructions, project reference, or terms…"
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value)}
          />
        </label>
      ) : null}
    </div>
  );

  const billingSummaryCard = (
    <div className="rounded-xl border border-[var(--sp-outline)] bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-[var(--sp-on)]">Summary</p>
      {billingPreview.subtotalCents > 0 ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[var(--sp-muted)]">Subtotal</span>
            <span className="font-medium">{formatMoney(billingPreview.subtotalCents)}</span>
          </div>
          {billingPreview.discountCents > 0 ? (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--sp-muted)]">Discount</span>
              <span className="text-emerald-600">-{formatMoney(billingPreview.discountCents)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <span className="text-[var(--sp-muted)]">VAT ({billingPreview.vatRatePercent}%)</span>
            <span>{formatMoney(billingPreview.taxCents)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-[var(--sp-outline)] pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-[var(--stitch-primary)]">{formatMoney(billingPreview.totalCents)}</span>
          </div>
          {tab === "invoices" && dueDays.trim() ? (
            <p className="text-xs text-[var(--sp-muted)] pt-1">
              Payment due in {dueDays || "14"} days from issue date.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--sp-muted)]">
          Add line items with prices to see the invoice total.
        </p>
      )}
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
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                      <td>{inv.user?.fullName}</td>
                      <td className="font-medium">{formatMoney(inv.totalCents)}</td>
                      <td>{formatMoney(inv.paidCents)}</td>
                      <td className={inv.totalCents - inv.paidCents > 0 ? "text-amber-600 font-medium" : ""}>
                        {formatMoney(Math.max(0, inv.totalCents - inv.paidCents))}
                      </td>
                      <td><span className="stitch-chip stitch-chip-violet text-[10px]">{inv.status}</span></td>
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
                  <p className="text-xs text-[var(--sp-muted)]">{customer.email}</p>
                  {(() => {
                    const row = clients.find((c) => c.id === customer.id);
                    if (!row?.billing) return null;
                    return (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs border-t border-[var(--stitch-primary)]/20 pt-2">
                        <div>
                          <span className="block text-[var(--sp-muted)]">Invoiced</span>
                          <strong>{formatMoney(row.billing.invoicedCents)}</strong>
                        </div>
                        <div>
                          <span className="block text-[var(--sp-muted)]">Paid</span>
                          <strong>{formatMoney(row.billing.paidCents)}</strong>
                        </div>
                        <div>
                          <span className="block text-[var(--sp-muted)]">Balance</span>
                          <strong className={row.billing.balanceCents > 0 ? "text-amber-600" : ""}>
                            {formatMoney(row.billing.balanceCents)}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
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
                    <th>Invoiced</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="block font-medium">{c.fullName}</span>
                        <span className="text-xs text-[var(--sp-muted)]">{c.email}</span>
                      </td>
                      <td className="font-mono text-xs">{c.customerCode || "—"}</td>
                      <td className="font-medium">{formatMoney(c.billing?.invoicedCents ?? 0)}</td>
                      <td>{formatMoney(c.billing?.paidCents ?? 0)}</td>
                      <td className={(c.billing?.balanceCents ?? 0) > 0 ? "text-amber-600 font-medium" : ""}>
                        {formatMoney(c.billing?.balanceCents ?? 0)}
                      </td>
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
        <div className="space-y-6">
          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <div>
                <h3>Create manual quotation</h3>
                <p className="text-sm text-[var(--sp-muted)] mt-0.5">
                  Quote for a registered client or walk-in customer.
                </p>
              </div>
              <Link href="/staff/quotations" className="stitch-btn-sm">Open quotations workspace</Link>
            </div>
            <div className="stitch-section-body">
              <form onSubmit={createManualQuotation}>
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6 min-w-0">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--sp-on)]">Customer</p>
                      <CustomerPicker
                        value={customer}
                        onChange={(c) => {
                          setCustomer(c);
                          if (c) {
                            setManualName(c.fullName);
                            setManualEmail(c.email);
                            setManualCompany(c.company || "");
                          }
                        }}
                      />
                      {!customer && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            className={INPUT}
                            placeholder="Customer name *"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            required
                          />
                          <input
                            className={INPUT}
                            type="email"
                            placeholder="Email *"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            required
                          />
                          <input
                            className={`${INPUT} sm:col-span-2`}
                            placeholder="Company"
                            value={manualCompany}
                            onChange={(e) => setManualCompany(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    {lineItemsForm}
                  </div>
                  <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
                    {billingTermsFields}
                    {billingSummaryCard}
                    <button type="submit" className="stitch-btn stitch-btn-primary w-full !py-3" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Create quotation"}
                    </button>
                  </aside>
                </div>
              </form>
            </div>
          </section>
          <section className="stitch-section-card">
            <div className="stitch-section-body text-sm text-[var(--sp-muted)] space-y-3">
              <p>
                After creating a quotation, open the quotations workspace to edit pricing, verify
                details, and email the PDF to the client.
              </p>
              <p>
                Auto-generated quotes from website requests appear as{" "}
                <strong className="text-[var(--sp-on)]">Pending review</strong>.
              </p>
            </div>
          </section>
        </div>
      )}

      {tab === "invoices" && (
        <div className="space-y-6">
          <section className="stitch-section-card">
            <div className="stitch-section-head">
              <div>
                <h3>Create invoice</h3>
                <p className="text-sm text-[var(--sp-muted)] mt-0.5">
                  Bill a registered portal client and email the PDF.
                </p>
              </div>
            </div>
            <div className="stitch-section-body">
              <form onSubmit={createInvoice}>
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6 min-w-0">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[var(--sp-on)]">Client</p>
                      <CustomerPicker value={customer} onChange={setCustomer} />
                      <p className={FIELD_HINT}>
                        Invoices require a registered portal client.{" "}
                        <Link href="/staff/clients" className="text-[var(--stitch-primary)] hover:underline">
                          Create a client first
                        </Link>{" "}
                        if none appear in the list.
                      </p>
                    </div>
                    {lineItemsForm}
                  </div>

                  <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
                    {billingTermsFields}
                    {billingSummaryCard}
                    <button
                      type="submit"
                      className="stitch-btn stitch-btn-primary w-full !py-3"
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      ) : (
                        "Create & send invoice"
                      )}
                    </button>
                  </aside>
                </div>
              </form>
            </div>
          </section>

          <section className="stitch-section-card">
            <div className="stitch-section-head"><h3>All invoices</h3></div>
            <div className="stitch-section-body overflow-x-auto">
              <table className="stitch-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const balance = inv.balanceCents ?? Math.max(0, inv.totalCents - inv.paidCents);
                    return (
                    <tr key={inv.id}>
                      <td className="font-mono text-xs">{inv.invoiceNumber}</td>
                      <td>{inv.user?.fullName}</td>
                      <td className="font-medium">{formatMoney(inv.totalCents)}</td>
                      <td>{formatMoney(inv.paidCents)}</td>
                      <td className={balance > 0 ? "text-amber-600 font-medium" : ""}>
                        {formatMoney(balance)}
                      </td>
                      <td><span className="stitch-chip text-[10px]">{inv.status}</span></td>
                      <td>
                        <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="stitch-btn-sm">PDF</a>
                        {balance > 0 ? (
                          <button
                            type="button"
                            className="stitch-btn-sm ml-1"
                            onClick={() => {
                              selectInvoiceForPayment(inv.id);
                              setMsg("");
                              setError("");
                            }}
                          >
                            Pay
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="stitch-section-head border-t border-[var(--sp-outline)] !mt-0">
              <div>
                <h3>Record payment</h3>
                <p className="text-sm text-[var(--sp-muted)] mt-0.5">
                  Apply a bank transfer, cash, or card payment against an open invoice.
                </p>
              </div>
            </div>
            <div className="stitch-section-body">
              {payableInvoices.length === 0 ? (
                <p className="text-sm text-[var(--sp-muted)] mb-3">
                  No invoices with balance due. Create an invoice with line-item prices first — zero-total
                  invoices cannot receive payments.
                </p>
              ) : null}
              <form onSubmit={recordPayment} className="grid sm:grid-cols-2 gap-3">
                <select
                  className={INPUT}
                  value={payForm.invoiceId}
                  onChange={(e) => selectInvoiceForPayment(e.target.value)}
                  required
                >
                  <option value="">Select invoice…</option>
                  {payableInvoices.map((i) => {
                    const balance = i.balanceCents ?? Math.max(0, i.totalCents - i.paidCents);
                    return (
                      <option key={i.id} value={i.id}>
                        {i.invoiceNumber} — {i.user?.fullName} — {formatMoney(balance)} due
                      </option>
                    );
                  })}
                </select>
                <input
                  className={INPUT}
                  placeholder="Amount LKR"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={payForm.amountLkr}
                  onChange={(e) => setPayForm({ ...payForm, amountLkr: e.target.value })}
                  required
                />
                <select className={INPUT} value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MANUAL">Manual</option>
                </select>
                <input className={INPUT} placeholder="Reference #" value={payForm.ref} onChange={(e) => setPayForm({ ...payForm, ref: e.target.value })} />
                {payForm.invoiceId ? (
                  <p className="sm:col-span-2 text-xs text-[var(--sp-muted)]">
                    {(() => {
                      const inv = invoices.find((i) => i.id === payForm.invoiceId);
                      if (!inv) return null;
                      const balance = inv.balanceCents ?? Math.max(0, inv.totalCents - inv.paidCents);
                      return `Invoice total ${formatMoney(inv.totalCents)} · Paid ${formatMoney(inv.paidCents)} · Balance ${formatMoney(balance)}`;
                    })()}
                  </p>
                ) : null}
                <button type="submit" className="stitch-btn stitch-btn-primary sm:col-span-2" disabled={busy || payableInvoices.length === 0}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Record payment & generate receipt"}
                </button>
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
                  <th>Receipt #</th>
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
                    <td className="font-mono text-xs">{p.receiptNumber || "—"}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>{p.user.fullName}</td>
                    <td>{p.invoice?.invoiceNumber || "—"}</td>
                    <td>{formatMoney(p.amountCents)}</td>
                    <td>{p.method.replace(/_/g, " ")}</td>
                    <td>
                      <a href={`/api/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="stitch-btn-sm">View receipt</a>
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
