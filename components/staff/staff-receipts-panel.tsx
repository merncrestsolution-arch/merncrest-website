"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { Download, Receipt, Search, Wallet } from "lucide-react";

type PaymentRow = {
  id: string;
  amountCents: number;
  method: string;
  referenceNumber?: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
  invoice?: { invoiceNumber: string; id?: string } | null;
};

function methodBadge(method: string) {
  const m = method.toUpperCase();
  if (m === "CASH") return "stitch-chip stitch-badge-done";
  if (m === "CARD") return "stitch-chip stitch-chip-violet";
  return "stitch-chip stitch-badge-pending";
}

export function StaffReceiptsPanel() {
  const [receipts, setReceipts] = useState<PaymentRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/billing?view=receipts")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        const rows = d.payments ?? [];
        setReceipts(rows);
        setSelected((prev) => prev ?? rows[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return receipts;
    const q = search.toLowerCase();
    return receipts.filter(
      (p) =>
        p.user.fullName.toLowerCase().includes(q) ||
        p.user.email.toLowerCase().includes(q) ||
        p.invoice?.invoiceNumber?.toLowerCase().includes(q) ||
        p.referenceNumber?.toLowerCase().includes(q)
    );
  }, [receipts, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = receipts.filter((p) => new Date(p.createdAt) >= monthStart);
    const totalAmount = receipts.reduce((s, p) => s + p.amountCents, 0);
    const monthAmount = thisMonth.reduce((s, p) => s + p.amountCents, 0);
    return {
      total: receipts.length,
      thisMonth: thisMonth.length,
      totalAmount,
      monthAmount,
    };
  }, [receipts]);

  return (
    <div>
      <div className="stitch-breadcrumb">
        <Link href="/staff">Dashboard</Link> &gt; Payment Receipts
      </div>
      <div className="stitch-page-head">
        <div>
          <h1 className="stitch-page-title">Payment Receipts</h1>
          <p className="stitch-page-sub">Verified payments and printable receipts.</p>
        </div>
        <Link href="/staff/billing" className="stitch-btn-sm">
          Billing hub
        </Link>
      </div>

      {error ? <p className="stitch-auth-error mb-4">{error}</p> : null}

      <div className="stitch-stat-grid mb-6">
        <div className="stitch-stat-card">
          <Receipt className="h-5 w-5 mb-2 text-[var(--sp-primary)]" />
          <div className="stitch-stat-num">{stats.total}</div>
          <div className="stitch-stat-label">Total receipts</div>
        </div>
        <div className="stitch-stat-card">
          <Wallet className="h-5 w-5 mb-2 text-[var(--sp-primary)]" />
          <div className="stitch-stat-num">{formatMoney(stats.totalAmount)}</div>
          <div className="stitch-stat-label">All-time collected</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{stats.thisMonth}</div>
          <div className="stitch-stat-label">This month</div>
        </div>
        <div className="stitch-stat-card">
          <div className="stitch-stat-num">{formatMoney(stats.monthAmount)}</div>
          <div className="stitch-stat-label">Month total</div>
        </div>
      </div>

      <div className="stitch-master-detail">
        <div className="stitch-master-detail-main">
          <div className="stitch-toolbar mb-3">
            <div className="stitch-search-wrap flex-1">
              <Search className="h-4 w-4" />
              <input
                className="stitch-input !border-0 !h-9 flex-1"
                placeholder="Search client, invoice, or reference…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <section className="stitch-section-card">
            <div className="stitch-section-body overflow-x-auto !p-0">
              <table className="stitch-table stitch-table-clickable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-[var(--sp-muted)] py-8">
                        No payment receipts yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        className={selected?.id === p.id ? "is-selected" : ""}
                        onClick={() => setSelected(p)}
                      >
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="block text-sm">{p.user.fullName}</span>
                          <span className="text-xs text-[var(--sp-muted)]">{p.user.email}</span>
                        </td>
                        <td>{p.invoice?.invoiceNumber || "—"}</td>
                        <td>{formatMoney(p.amountCents)}</td>
                        <td>
                          <span className={methodBadge(p.method)}>
                            {p.method.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="stitch-detail-panel">
          {!selected ? (
            <p className="stitch-page-sub p-6">Select a receipt to view details.</p>
          ) : (
            <>
              <div className="stitch-detail-head">
                <h3 className="text-lg font-semibold m-0">Receipt details</h3>
                <p className="text-xs text-[var(--sp-muted)] mt-2 mb-0">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="stitch-section-body space-y-3">
                <div className="stitch-row !flex-col !items-start gap-1">
                  <span className="text-xs text-[var(--sp-muted)]">Client</span>
                  <strong>{selected.user.fullName}</strong>
                  <span className="text-sm text-[var(--sp-muted)]">{selected.user.email}</span>
                </div>
                <div className="stitch-row">
                  <span className="text-sm text-[var(--sp-muted)]">Invoice</span>
                  <span>{selected.invoice?.invoiceNumber || "—"}</span>
                </div>
                <div className="stitch-row">
                  <span className="text-sm text-[var(--sp-muted)]">Amount</span>
                  <strong>{formatMoney(selected.amountCents)}</strong>
                </div>
                <div className="stitch-row">
                  <span className="text-sm text-[var(--sp-muted)]">Method</span>
                  <span className={methodBadge(selected.method)}>
                    {selected.method.replace(/_/g, " ")}
                  </span>
                </div>
                {selected.referenceNumber ? (
                  <div className="stitch-row">
                    <span className="text-sm text-[var(--sp-muted)]">Reference</span>
                    <span className="font-mono text-sm">{selected.referenceNumber}</span>
                  </div>
                ) : null}
                <a
                  href={`/api/payments/${selected.id}/receipt`}
                  target="_blank"
                  rel="noreferrer"
                  className="stitch-btn-primary-sm w-full justify-center mt-4"
                >
                  <Download className="h-4 w-4" />
                  View / print receipt
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
