"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import {
  Download,
  FileText,
  Mail,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
} from "lucide-react";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  currency: string;
  dueAt?: string | null;
  createdAt: string;
  lineItemsJson?: string | null;
  user?: { fullName: string; email: string };
  payments?: { id: string; amountCents: number; method: string; createdAt: string; referenceNumber?: string | null }[];
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
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as { description: string; qty: number; unitCents: number }[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function StaffInvoicesPanel() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [vatRate, setVatRate] = useState(18);
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InvoiceRow | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/invoices")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setInvoices(d.invoices ?? []);
        if (d.vatRatePercent) setVatRate(d.vatRatePercent);
        setSelected((prev) => prev ?? d.invoices?.[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    const pending = invoices.filter((i) => ["SENT", "PARTIALLY_PAID", "DRAFT"].includes(i.status.toUpperCase()));
    const overdue = invoices.filter((i) => i.status.toUpperCase() === "OVERDUE");
    return {
      total: invoices.length,
      paidCount: paid.length,
      paidAmount: paid.reduce((s, i) => s + i.paidCents, 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, i) => s + (i.totalCents - i.paidCents), 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + (i.totalCents - i.paidCents), 0),
    };
  }, [invoices]);

  const lines = selected ? parseLines(selected.lineItemsJson) : [];
  const lastPayment = selected?.payments?.[0];

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
                <div className="flex gap-2">
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
                </div>
              </div>
              {lastPayment ? (
                <div className="stitch-detail-section">
                  <h4>Payment Information</h4>
                  <div className="stitch-row text-sm">
                    <span className="text-[var(--sp-muted)]">Method</span>
                    <span>{lastPayment.method}</span>
                  </div>
                  <div className="stitch-row text-sm">
                    <span className="text-[var(--sp-muted)]">Date</span>
                    <span>{new Date(lastPayment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="stitch-row text-sm">
                    <span className="text-[var(--sp-muted)]">Amount Paid</span>
                    <span>{formatMoney(lastPayment.amountCents, selected.currency)}</span>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="stitch-page-sub p-4">Select an invoice to preview.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
