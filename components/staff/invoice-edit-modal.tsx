"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { parseInvoiceDocument } from "@/lib/billing/invoice-pdf-html";

type LineRow = {
  description: string;
  qty: number;
  unitCents: number;
};

type InvoiceEditModalProps = {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    paidCents: number;
    totalCents: number;
    dueAt?: string | null;
    lineItemsJson?: string | null;
  };
  vatRate: number;
  onClose: () => void;
  onSaved: () => void;
};

function centsToLkr(cents: number) {
  return (cents / 100).toFixed(2);
}

function lkrToCents(value: string) {
  const n = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function readAdvanceCents(json?: string | null) {
  if (!json) return 0;
  try {
    const p = JSON.parse(json) as { advanceCents?: number };
    return Math.max(0, p.advanceCents ?? 0);
  } catch {
    return 0;
  }
}

export function InvoiceEditModal({ invoice, vatRate, onClose, onSaved }: InvoiceEditModalProps) {
  const parsed = useMemo(
    () => parseInvoiceDocument(invoice.lineItemsJson, []),
    [invoice.lineItemsJson]
  );

  const [status, setStatus] = useState(invoice.status);
  const [dueAt, setDueAt] = useState(
    invoice.dueAt ? new Date(invoice.dueAt).toISOString().slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(parsed.notes ?? "");
  const [vatRatePercent, setVatRatePercent] = useState(parsed.vatRatePercent ?? vatRate);
  const [discountCents, setDiscountCents] = useState(parsed.discountCents ?? 0);
  const [advanceCents, setAdvanceCents] = useState(readAdvanceCents(invoice.lineItemsJson));
  const [lines, setLines] = useState<LineRow[]>(
    parsed.lines.length
      ? parsed.lines.map((l) => ({
          description: l.description,
          qty: l.qty,
          unitCents: l.unitCents,
        }))
      : [{ description: "", qty: 1, unitCents: 0 }]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hasPayments = invoice.paidCents > 0;

  useEffect(() => {
    setStatus(invoice.status);
    setDueAt(invoice.dueAt ? new Date(invoice.dueAt).toISOString().slice(0, 10) : "");
    setNotes(parsed.notes ?? "");
    setVatRatePercent(parsed.vatRatePercent ?? vatRate);
    setDiscountCents(parsed.discountCents ?? 0);
    setAdvanceCents(readAdvanceCents(invoice.lineItemsJson));
    setLines(
      parsed.lines.length
        ? parsed.lines.map((l) => ({
            description: l.description,
            qty: l.qty,
            unitCents: l.unitCents,
          }))
        : [{ description: "", qty: 1, unitCents: 0 }]
    );
  }, [invoice, parsed, vatRate]);

  function updateLine(index: number, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addLine() {
    setLines((prev) => [...prev, { description: "", qty: 1, unitCents: 0 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const validLines = lines.filter((l) => l.description.trim() && l.unitCents > 0);
    if (!validLines.length) {
      setError("Add at least one line item with description and amount.");
      setBusy(false);
      return;
    }

    const payload = {
      status,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      notes: notes.trim() || undefined,
      lineItems: validLines.map((l) => ({
        description: l.description.trim(),
        qty: l.qty,
        unitCents: l.unitCents,
      })),
      vatRatePercent,
      discountCents,
      advanceCents,
    };

    try {
      const res = await fetch(`/api/staff/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error?.message ?? "Update failed");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stitch-modal-backdrop" onClick={onClose}>
      <div className="stitch-modal stitch-modal-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="stitch-modal-head">
          <h3>Edit invoice {invoice.invoiceNumber}</h3>
          <button type="button" className="stitch-btn-icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="stitch-modal-body space-y-4 text-sm">
          {error ? <p className="stitch-auth-error">{error}</p> : null}

          {hasPayments ? (
            <p className="text-xs rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200">
              This invoice has {centsToLkr(invoice.paidCents)} LKR recorded. You can edit all
              fields; balance and status will update based on payments vs the new total.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[var(--sp-muted)] text-xs">Status</span>
              <select className="stitch-input mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="DRAFT">DRAFT</option>
                <option value="SENT">SENT</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="VOID">VOID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[var(--sp-muted)] text-xs">Due date</span>
              <input
                type="date"
                className="stitch-input mt-1"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[var(--sp-muted)] text-xs">Notes</span>
            <textarea
              className="stitch-input mt-1 min-h-[72px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Line items</span>
              <button type="button" className="stitch-btn-outline-sm" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" />
                Add line
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_36px] items-end">
                  <input
                    className="stitch-input"
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    required
                  />
                  <input
                    className="stitch-input"
                    type="number"
                    min={1}
                    step={1}
                    value={line.qty}
                    onChange={(e) => updateLine(i, { qty: Number(e.target.value) || 1 })}
                  />
                  <input
                    className="stitch-input"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="LKR"
                    value={centsToLkr(line.unitCents)}
                    onChange={(e) => updateLine(i, { unitCents: lkrToCents(e.target.value) })}
                    required
                  />
                  <button
                    type="button"
                    className="stitch-btn-icon"
                    onClick={() => removeLine(i)}
                    disabled={lines.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-[var(--sp-muted)] text-xs">Discount (LKR)</span>
              <input
                className="stitch-input mt-1"
                type="number"
                min={0}
                step="0.01"
                value={centsToLkr(discountCents)}
                onChange={(e) => setDiscountCents(lkrToCents(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-[var(--sp-muted)] text-xs">VAT rate (%)</span>
              <input
                className="stitch-input mt-1"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={vatRatePercent}
                onChange={(e) => setVatRatePercent(Number(e.target.value) || 0)}
              />
            </label>
            <label className="block">
              <span className="text-[var(--sp-muted)] text-xs">Advance (LKR)</span>
              <input
                className="stitch-input mt-1"
                type="number"
                min={0}
                step="0.01"
                value={centsToLkr(advanceCents)}
                onChange={(e) => setAdvanceCents(lkrToCents(e.target.value))}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="stitch-btn-outline-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="stitch-btn-primary-sm" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
