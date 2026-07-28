"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { parseInvoiceDocument } from "@/lib/billing/invoice-pdf-html";
import {
  Download,
  FileText,
  Mail,
  Pencil,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { InvoiceEditModal } from "@/components/staff/invoice-edit-modal";
import type { Role } from "@/lib/auth-types";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  advancePaymentsCents?: number;
  remainingBalanceCents?: number;
  dueAmountCents?: number;
  balanceCents?: number;
  currency: string;
  dueAt?: string | null;
  createdAt: string;
  lineItemsJson?: string | null;
  user?: { fullName: string; email: string };
  project?: { id: string; name: string; projectCode: string } | null;
  payments?: {
    id: string;
    amountCents: number;
    method: string;
    isAdvance?: boolean;
    createdAt: string;
    referenceNumber?: string | null;
  }[];
};

type StatusTab = "ALL" | "PAID" | "PENDING" | "OVERDUE" | "CANCELLED";

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "PAID") return "stitch-chip stitch-badge-done";
  if (s === "OVERDUE") return "stitch-chip stitch-badge-danger";
  if (s === "CANCELLED" || s === "VOID") return "stitch-chip";
  return "stitch-chip stitch-badge-pending";
}

function parseLines(json?: string | null) {
  return parseInvoiceDocument(json, []).lines;
}

export function StaffInvoicesPanel() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [vatRate, setVatRate] = useState(18);
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InvoiceRow | null>(null);
  const [error, setError] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payAdvance, setPayAdvance] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [canAdminBilling, setCanAdminBilling] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/staff/invoices")
      .then(async (r) => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message ?? "Failed");
        setInvoices(d.data ?? []);
        if (d.meta?.vatRatePercent) setVatRate(d.meta.vatRatePercent);
        setSelected((prev) => prev ?? d.data?.[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        const role = d.user?.role as Role | undefined;
        setCanAdminBilling(role === "OWNER" || role === "ADMIN");
      })
      .catch(() => setCanAdminBilling(false));
  }, []);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const s = inv.status.toUpperCase();
      if (statusTab === "PAID" && s !== "PAID") return false;
      if (statusTab === "PENDING" && !["SENT", "PARTIALLY_PAID", "DRAFT"].includes(s)) return false;
      if (statusTab === "OVERDUE" && s !== "OVERDUE") return false;
      if (statusTab === "CANCELLED" && !["CANCELLED", "VOID"].includes(s)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.user?.fullName?.toLowerCase().includes(q) ||
          inv.user?.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusTab, search]);

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status.toUpperCase() === "PAID");
    const pending = invoices.filter((i) =>
      ["SENT", "PARTIALLY_PAID", "DRAFT", "OVERDUE"].includes(i.status.toUpperCase())
    );
    const overdue = invoices.filter((i) => i.status.toUpperCase() === "OVERDUE");
    const dueOf = (i: InvoiceRow) =>
      i.remainingBalanceCents ?? i.dueAmountCents ?? i.balanceCents ?? Math.max(0, i.totalCents - i.paidCents);
    return {
      total: invoices.length,
      paidCount: paid.length,
      paidAmount: paid.reduce((s, i) => s + i.paidCents, 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, i) => s + dueOf(i), 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + dueOf(i), 0),
    };
  }, [invoices]);

  const lines = selected ? parseLines(selected.lineItemsJson) : [];
  const balance = selected?.remainingBalanceCents ?? selected?.balanceCents ?? 0;

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cents = Math.round(Number(payAmount.replace(/,/g, "")) * 100);
    if (!cents || cents <= 0) return;
    setPayBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/invoices/${selected.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: cents,
          method: payMethod,
          isAdvance: payAdvance,
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Payment failed");
      setPayAmount("");
      setSelected(d.data.invoice);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPayBusy(false);
    }
  }

  async function deleteInvoice() {
    if (!selected || !canAdminBilling) return;
    const ok = window.confirm(
      `Delete invoice ${selected.invoiceNumber}? This cannot be undone. Invoices with payments must be voided instead.`
    );
    if (!ok) return;
    setDeleteBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/invoices/${selected.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Delete failed");
      setSelected(null);
      setShowEdit(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <div className="stitch-breadcrumb">
        <Link href="/staff">Dashboard</Link> &gt; Billing &amp; Invoices
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="stitch-page-title">Billing &amp; Invoices</h1>
          <p className="stitch-page-sub !mb-0">Manage invoices, payments, and client billing.</p>
        </div>
        <Link href="/staff/invoices" className="stitch-btn-primary-sm">
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-kpi-grid !grid-cols-2 lg:!grid-cols-4 mb-6">
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-blue">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.total}</div>
          <div className="stitch-kpi-label">Total Invoices</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-green">
            <FileText className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.paidCount}</div>
          <div className="stitch-kpi-label">Paid Invoices</div>
          <div className="stitch-kpi-meta">{formatMoney(stats.paidAmount)}</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-orange">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.pendingCount}</div>
          <div className="stitch-kpi-label">Pending Invoices</div>
          <div className="stitch-kpi-meta">{formatMoney(stats.pendingAmount)}</div>
        </div>
        <div className="stitch-kpi-card">
          <div className="stitch-kpi-icon stitch-kpi-icon-purple">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="stitch-kpi-value">{stats.overdueCount}</div>
          <div className="stitch-kpi-label">Overdue Invoices</div>
          <div className="stitch-kpi-meta">{formatMoney(stats.overdueAmount)}</div>
        </div>
      </div>

      <div className="stitch-master-detail">
        <div className="stitch-master-detail-main">
          <div className="stitch-tab-row">
            {(
              [
                ["ALL", "All Invoices"],
                ["PAID", "Paid"],
                ["PENDING", "Pending"],
                ["OVERDUE", "Overdue"],
                ["CANCELLED", "Cancelled"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={statusTab === id ? "active" : ""}
                onClick={() => setStatusTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="stitch-toolbar">
            <div className="stitch-search-wrap !max-w-none flex-1">
              <Search className="stitch-search-icon" />
              <input
                type="search"
                placeholder="Search invoices…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="stitch-select-sm">
              <option>This Year</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
            <button type="button" className="stitch-btn-outline-sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          </div>

          <section className="stitch-section-card">
            <div className="stitch-section-body overflow-x-auto !p-0">
              <table className="stitch-table stitch-table-clickable">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className={selected?.id === inv.id ? "is-selected" : ""}
                      onClick={() => setSelected(inv)}
                    >
                      <td>
                        <span className="text-[var(--stitch-primary)] font-medium">{inv.invoiceNumber}</span>
                      </td>
                      <td>{inv.user?.fullName || "—"}</td>
                      <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td>{inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}</td>
                      <td>{formatMoney(inv.totalCents, inv.currency)}</td>
                      <td>{formatMoney(inv.remainingBalanceCents ?? inv.balanceCents ?? 0, inv.currency)}</td>
                      <td>
                        <span className={statusBadge(inv.status)}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="stitch-pagination">
                Showing 1 to {filtered.length} of {invoices.length} invoices
              </div>
            </div>
          </section>
        </div>

        <aside className="stitch-detail-panel">
          {selected ? (
            <>
              <div className="stitch-detail-panel-head">
                <h3>Invoice Details</h3>
                <div className="flex flex-wrap gap-2">
                  {canAdminBilling ? (
                    <>
                      <button
                        type="button"
                        className="stitch-btn-outline-sm"
                        onClick={() => setShowEdit(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="stitch-btn-outline-sm"
                        onClick={deleteInvoice}
                        disabled={deleteBusy}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  ) : null}
                  <a
                    href={`/api/invoices/${selected.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="stitch-btn-outline-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </a>
                  <button type="button" className="stitch-btn-primary-sm">
                    <Mail className="h-3.5 w-3.5" />
                    Send Email
                  </button>
                </div>
              </div>
              <div className="stitch-invoice-preview">
                <div className="stitch-invoice-preview-head">
                  <strong>MernCrest Solutions (PVT) Ltd</strong>
                  <span className="font-mono text-xs">{selected.invoiceNumber}</span>
                </div>
                <p className="text-xs text-[var(--sp-muted)] mt-2">
                  Bill to: {selected.user?.fullName}
                  <br />
                  {selected.user?.email}
                </p>
                <table className="stitch-table mt-4 text-xs">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length ? (
                      lines.map((line, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{line.description}</td>
                          <td>{line.qty}</td>
                          <td>{formatMoney(line.qty * line.unitCents, selected.currency)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-[var(--sp-muted)]">
                          Service charges
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="stitch-invoice-totals">
                  <div>
                    <span>Sub Total</span>
                    <span>{formatMoney(selected.subtotalCents, selected.currency)}</span>
                  </div>
                  <div>
                    <span>VAT ({vatRate}%)</span>
                    <span>{formatMoney(selected.taxCents, selected.currency)}</span>
                  </div>
                  <div className="total">
                    <span>Total</span>
                    <span>{formatMoney(selected.totalCents, selected.currency)}</span>
                  </div>
                  {selected.paidCents > 0 ? (
                    <>
                      <div>
                        <span>Advance</span>
                        <span>{formatMoney(selected.advancePaymentsCents ?? 0, selected.currency)}</span>
                      </div>
                      <div>
                        <span>Paid</span>
                        <span>{formatMoney(selected.paidCents, selected.currency)}</span>
                      </div>
                      <div className="total">
                        <span>Balance due</span>
                        <span>{formatMoney(balance, selected.currency)}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              {balance > 0 ? (
                <div className="stitch-detail-section">
                  <h4>Record payment</h4>
                  <form onSubmit={recordPayment} className="space-y-2">
                    <input
                      className="stitch-input"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount (LKR)"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                    />
                    <select
                      className="stitch-input"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option value="BANK_TRANSFER">Bank transfer</option>
                      <option value="MANUAL">Manual / cash</option>
                      <option value="PAYHERE">PayHere</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={payAdvance} onChange={(e) => setPayAdvance(e.target.checked)} />
                      Advance payment
                    </label>
                    <button type="submit" className="stitch-btn-primary-sm w-full" disabled={payBusy}>
                      Record payment
                    </button>
                  </form>
                </div>
              ) : null}
              {selected.payments && selected.payments.length > 0 ? (
                <div className="stitch-detail-section">
                  <h4>Payment history</h4>
                  <ul className="space-y-2 text-sm">
                    {selected.payments.map((p) => (
                      <li key={p.id} className="flex justify-between gap-2">
                        <span>
                          {formatMoney(p.amountCents, selected.currency)}
                          {p.isAdvance ? " · Advance" : ""}
                          <span className="text-[var(--sp-muted)]"> · {p.method}</span>
                        </span>
                        <span className="text-[var(--sp-muted)]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p className="stitch-page-sub p-4">Select an invoice to preview.</p>
          )}
        </aside>
      </div>

      {showEdit && selected ? (
        <InvoiceEditModal
          invoice={selected}
          vatRate={vatRate}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            load();
            fetch(`/api/staff/invoices/${selected.id}`)
              .then(async (r) => {
                const d = await r.json();
                if (d.success) setSelected(d.data);
              })
              .catch(() => undefined);
          }}
        />
      ) : null}
    </div>
  );
}
