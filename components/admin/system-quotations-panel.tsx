"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
import { Loader2, Mail, Plus, Save, Trash2 } from "lucide-react";

type QuoteItem = {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents?: number;
};

type Quote = {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  company?: string | null;
  status: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  validUntil: string;
  terms?: string | null;
  notes?: string | null;
  items: QuoteItem[];
  lead?: { fullName: string; stage: string; interest?: string | null } | null;
};

type EditableItem = {
  description: string;
  quantity: number;
  unitPriceLkr: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes requested",
  EXPIRED: "Expired",
};

function centsToLkrInput(cents: number) {
  return (cents / 100).toString();
}

function lkrInputToCents(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

const INPUT =
  "stitch-input w-full";

function emptyItem(): EditableItem {
  return { description: "", quantity: 1, unitPriceLkr: "" };
}

function buildPayload(
  selected: Quote,
  fields: {
    customerName: string;
    customerEmail: string;
    company: string;
    terms: string;
    notes: string;
    discountLkr: string;
    taxLkr: string;
    vatPercent: string;
    validDays: string;
    items: EditableItem[];
  }
) {
  const items = fields.items
    .filter((i) => i.description.trim())
    .map((i) => ({
      description: i.description.trim(),
      quantity: i.quantity,
      unitPriceCents: lkrInputToCents(i.unitPriceLkr),
    }));
  if (!items.length) throw new Error("Add at least one line item");
  for (const item of items) {
    if (item.unitPriceCents <= 0) {
      throw new Error(`Enter a unit price (LKR) for "${item.description}"`);
    }
  }
  const lineSubtotal = items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);
  const totals = calcBillingTotals({
    lineSubtotalCents: lineSubtotal,
    discountCents: lkrInputToCents(fields.discountLkr),
    taxCents: fields.taxLkr.trim() ? lkrInputToCents(fields.taxLkr) : undefined,
    vatRatePercent: Number(fields.vatPercent) || 18,
  });
  return {
    quotationId: selected.id,
    customerName: fields.customerName,
    customerEmail: fields.customerEmail,
    company: fields.company || null,
    terms: fields.terms || null,
    notes: fields.notes || null,
    discountCents: totals.discountCents,
    taxCents: totals.taxCents,
    vatRatePercent: totals.vatRatePercent,
    validDays: Number(fields.validDays) || 14,
    items,
  };
}

export function SystemQuotationsPanel({
  variant = "admin",
}: {
  variant?: "admin" | "staff";
}) {
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [company, setCompany] = useState("");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [discountLkr, setDiscountLkr] = useState("0");
  const [taxLkr, setTaxLkr] = useState("");
  const [vatPercent, setVatPercent] = useState("18");
  const [validDays, setValidDays] = useState("14");
  const [items, setItems] = useState<EditableItem[]>([emptyItem()]);

  const selected = useMemo(
    () => quotes.find((q) => q.id === selectedId) ?? null,
    [quotes, selectedId]
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/quotations");
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed to load quotations");
    else setQuotes(d.quotations ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const fromUrl = searchParams.get("quote");
    if (fromUrl) setSelectedId(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (!selected) return;
    setCustomerName(selected.customerName);
    setCustomerEmail(selected.customerEmail);
    setCompany(selected.company || "");
    setTerms(selected.terms || "");
    setNotes(selected.notes || "");
    setDiscountLkr(centsToLkrInput(selected.discountCents));
    setTaxLkr(centsToLkrInput(selected.taxCents));
    const derivedVat =
      selected.subtotalCents - selected.discountCents > 0
        ? Math.round((selected.taxCents / (selected.subtotalCents - selected.discountCents)) * 100)
        : 18;
    setVatPercent(String(derivedVat));
    setItems(
      selected.items.length
        ? selected.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPriceLkr: centsToLkrInput(i.unitPriceCents),
          }))
        : [emptyItem()]
    );
    setError("");
    setMsg("");
  }, [selected]);

  const previewTotals = useMemo(() => {
    const lineSubtotal = items
      .filter((i) => i.description.trim())
      .reduce((s, i) => s + i.quantity * lkrInputToCents(i.unitPriceLkr), 0);
    const manualTax = taxLkr.trim() ? lkrInputToCents(taxLkr) : undefined;
    const vatRate = Number(vatPercent);
    return calcBillingTotals({
      lineSubtotalCents: lineSubtotal,
      discountCents: lkrInputToCents(discountLkr),
      taxCents: manualTax,
      vatRatePercent: Number.isFinite(vatRate) ? vatRate : 18,
    });
  }, [items, discountLkr, taxLkr, vatPercent]);

  const canEdit = showCreate || (selected && !["SENT", "ACCEPTED"].includes(selected.status));

  async function persistDraft() {
    if (!selected) throw new Error("No quotation selected");
    const payload = buildPayload(selected, {
      customerName,
      customerEmail,
      company,
      terms,
      notes,
      discountLkr,
      taxLkr,
      vatPercent,
      validDays,
      items,
    });
    const res = await fetch("/api/quotations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");
    await load();
    setSelectedId(data.quotation.id);
    return data.quotation as Quote;
  }

  async function saveDraft() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await persistDraft();
      setMsg("Draft saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendToCustomer() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const saved = await persistDraft();
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId: saved.id, action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setMsg(data.message || "Quotation emailed to customer");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function createQuotation() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const itemsPayload = items
        .filter((i) => i.description.trim())
        .map((i) => ({
          description: i.description.trim(),
          quantity: i.quantity,
          unitPriceCents: lkrInputToCents(i.unitPriceLkr),
        }));
      if (!itemsPayload.length) throw new Error("Add at least one line item");
      if (!customerName.trim() || !customerEmail.trim()) {
        throw new Error("Customer name and email are required");
      }
      const lineSubtotal = itemsPayload.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);
      const totals = calcBillingTotals({
        lineSubtotalCents: lineSubtotal,
        discountCents: lkrInputToCents(discountLkr),
        taxCents: taxLkr.trim() ? lkrInputToCents(taxLkr) : undefined,
        vatRatePercent: Number(vatPercent) || 18,
      });
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          company: company.trim() || undefined,
          terms: terms.trim() || undefined,
          notes: notes.trim() || undefined,
          discountCents: totals.discountCents,
          taxCents: totals.taxCents,
          validDays: Number(validDays) || 14,
          items: itemsPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setShowCreate(false);
      setMsg("Quotation created");
      await load();
      if (data.quotation?.id) setSelectedId(data.quotation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuotation() {
    if (!selected) return;
    if (!confirm(`Delete quotation ${selected.quoteNumber}?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/quotations?id=${encodeURIComponent(selected.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setSelectedId(null);
      setMsg("Quotation deleted");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function convertToInvoice() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invoiceFromQuote",
          quotationId: selected.id,
          send: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(data.message || "Invoice created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const pendingCount = quotes.filter((q) => q.status === "PENDING_REVIEW").length;

  return (
    <>
      {variant === "staff" ? (
        <div className="stitch-breadcrumb">Dashboard &gt; Quotations</div>
      ) : null}
      <div className={variant === "staff" ? "stitch-page-head" : ""}>
        <div>
          <h1 className="stitch-page-title">Quotations</h1>
          <p className={`stitch-page-sub ${variant === "staff" ? "!mb-0" : "!mb-5"}`}>
            Review auto-generated quotes, edit pricing, then email the PDF to the customer.
            {pendingCount > 0 ? (
              <span className="ml-2 stitch-chip stitch-chip-violet">{pendingCount} pending review</span>
            ) : null}
          </p>
        </div>
        {variant === "staff" ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="stitch-btn-primary-sm"
              onClick={() => {
                setSelectedId(null);
                setCustomerName("");
                setCustomerEmail("");
                setCompany("");
                setTerms("");
                setNotes("");
                setDiscountLkr("0");
                setTaxLkr("");
                setVatPercent("18");
                setValidDays("14");
                setItems([emptyItem()]);
                setShowCreate(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New quotation
            </button>
            <Link href="/staff/billing" className="stitch-btn-sm">
              Billing hub
            </Link>
          </div>
        ) : null}
      </div>
      {variant === "staff" ? <div className="mb-5" /> : null}

      {error ? <p className="stitch-auth-error !mb-4">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-600 !mb-4">{msg}</p> : null}

      <div className="grid lg:grid-cols-5 gap-5">
        <section className="stitch-section-card lg:col-span-2">
          <div className="stitch-section-head">
            <h3>All quotations</h3>
          </div>
          <div className="stitch-section-body overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className={`cursor-pointer ${selectedId === q.id ? "is-selected" : ""}`}
                    onClick={() => setSelectedId(q.id)}
                  >
                    <td className="font-mono text-xs">{q.quoteNumber}</td>
                    <td>
                      <span className="block text-sm">{q.customerName}</span>
                      <span className="text-xs text-[var(--sp-muted)]">{q.customerEmail}</span>
                    </td>
                    <td className="font-medium whitespace-nowrap">
                      {q.totalCents > 0 ? formatMoney(q.totalCents, q.currency) : (
                        <span className="text-amber-600 text-xs">Set pricing</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`stitch-chip text-[10px] ${
                          q.status === "PENDING_REVIEW"
                            ? "stitch-chip-violet"
                            : q.status === "SENT"
                              ? "stitch-chip-violet"
                              : ""
                        }`}
                      >
                        {STATUS_LABELS[q.status] || q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stitch-section-card lg:col-span-3">
          <div className="stitch-section-head">
            <h3>
              {showCreate
                ? "New quotation"
                : selected
                  ? `Edit ${selected.quoteNumber}`
                  : "Select a quotation"}
            </h3>
            {selected && !showCreate ? (
              <a
                href={`/api/quotations/${selected.id}/pdf`}
                className="stitch-btn-sm"
                target="_blank"
                rel="noreferrer"
              >
                Preview PDF
              </a>
            ) : null}
          </div>
          <div className="stitch-section-body space-y-4">
            {!selected && !showCreate ? (
              <p className="text-sm text-muted">
                Choose a quotation from the list — or click <strong>New quotation</strong> to create one.
              </p>
            ) : (
              <>
                {selected?.lead?.interest ? (
                  <p className="text-xs rounded-lg border border-[var(--sp-outline)] bg-[var(--stitch-primary-soft)] px-3 py-2 text-[var(--sp-primary)]">
                    Lead interest: {selected.lead.interest}
                  </p>
                ) : null}

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className={INPUT}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    disabled={!canEdit || busy}
                  />
                  <input
                    className={INPUT}
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Customer email"
                    disabled={!canEdit || busy}
                  />
                  <input
                    className={`${INPUT} sm:col-span-2`}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company (optional)"
                    disabled={!canEdit || busy}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Line items
                    </p>
                    {canEdit ? (
                      <button
                        type="button"
                        className="stitch-btn-sm"
                        onClick={() => setItems((prev) => [...prev, emptyItem()])}
                        disabled={busy}
                      >
                        <Plus className="h-3 w-3 mr-1 inline" /> Add line
                      </button>
                    ) : null}
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid sm:grid-cols-12 gap-2 items-start">
                      <input
                        className={`${INPUT} sm:col-span-6`}
                        value={item.description}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, description: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Description"
                        disabled={!canEdit || busy}
                      />
                      <input
                        className={`${INPUT} sm:col-span-2`}
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, quantity: Number(e.target.value) || 1 } : row
                            )
                          )
                        }
                        placeholder="Qty"
                        disabled={!canEdit || busy}
                      />
                      <input
                        className={`${INPUT} sm:col-span-3`}
                        value={item.unitPriceLkr}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, unitPriceLkr: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Unit LKR"
                        disabled={!canEdit || busy}
                      />
                      {canEdit && items.length > 1 ? (
                        <button
                          type="button"
                          className="sm:col-span-1 p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={busy}
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="text-xs text-muted">
                    Discount (LKR)
                    <input
                      className={`${INPUT} mt-1`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={discountLkr}
                      onChange={(e) => setDiscountLkr(e.target.value)}
                      disabled={!canEdit || busy}
                    />
                  </label>
                  <label className="text-xs text-muted">
                    VAT %
                    <input
                      className={`${INPUT} mt-1`}
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={vatPercent}
                      onChange={(e) => setVatPercent(e.target.value)}
                      disabled={!canEdit || busy}
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Tax (LKR)
                    <input
                      className={`${INPUT} mt-1`}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Auto from VAT %"
                      value={taxLkr}
                      onChange={(e) => setTaxLkr(e.target.value)}
                      disabled={!canEdit || busy}
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Valid (days)
                    <input
                      className={`${INPUT} mt-1`}
                      type="number"
                      min={1}
                      max={90}
                      value={validDays}
                      onChange={(e) => setValidDays(e.target.value)}
                      disabled={!canEdit || busy}
                    />
                  </label>
                </div>

                <textarea
                  className={`${INPUT} min-h-[72px]`}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Payment terms"
                  disabled={!canEdit || busy}
                />
                <textarea
                  className={`${INPUT} min-h-[72px]`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal / customer notes"
                  disabled={!canEdit || busy}
                />

                <div className="rounded-xl border border-[var(--sp-outline)] bg-[var(--stitch-surface-low)] p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span>{formatMoney(previewTotals.subtotalCents)}</span>
                  </div>
                  {previewTotals.discountCents > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-muted">Discount</span>
                      <span>-{formatMoney(previewTotals.discountCents)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-muted">VAT ({previewTotals.vatRatePercent}%)</span>
                    <span>{formatMoney(previewTotals.taxCents)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-[var(--sp-outline)]">
                    <span>Total</span>
                    <span>{formatMoney(previewTotals.totalCents)}</span>
                  </div>
                </div>

                {canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    {showCreate ? (
                      <>
                        <button
                          type="button"
                          className="stitch-btn stitch-btn-primary"
                          onClick={createQuotation}
                          disabled={busy}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2 inline" />
                          )}
                          Create quotation
                        </button>
                        <button
                          type="button"
                          className="stitch-btn-outline"
                          onClick={() => setShowCreate(false)}
                          disabled={busy}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="stitch-btn"
                          onClick={saveDraft}
                          disabled={busy}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          ) : (
                            <Save className="h-4 w-4 mr-2 inline" />
                          )}
                          Save draft
                        </button>
                        <button
                          type="button"
                          className="stitch-btn stitch-btn-primary"
                          onClick={sendToCustomer}
                          disabled={busy}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2 inline" />
                          )}
                          Verify &amp; send to customer
                        </button>
                        <button
                          type="button"
                          className="stitch-btn-outline text-red-400"
                          onClick={deleteQuotation}
                          disabled={busy}
                        >
                          <Trash2 className="h-4 w-4 mr-2 inline" />
                          Delete
                        </button>
                        <Link href="/staff/billing" className="stitch-btn-outline">
                          Billing hub
                        </Link>
                      </>
                    )}
                  </div>
                ) : selected && selected.status === "SENT" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="stitch-btn stitch-btn-primary"
                      onClick={convertToInvoice}
                      disabled={busy}
                    >
                      Create invoice from quote
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    This quotation has been sent or accepted and can no longer be edited.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
