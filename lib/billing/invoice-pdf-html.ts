import { formatMoney } from "@/lib/commerce-format";

export type InvoicePdfLine = {
  description: string;
  qty: number;
  unitCents: number;
  discountCents?: number;
};

export type InvoicePdfData = {
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotalCents: number;
  discountCents?: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  advancePaymentsCents?: number;
  remainingBalanceCents?: number;
  dueAmountCents?: number;
  createdAt: Date;
  dueAt: Date | null;
  customer: {
    fullName: string;
    email: string;
    company?: string | null;
    address?: string;
    country?: string;
  };
  orderNumber: string;
  lines: InvoicePdfLine[];
  vatRatePercent?: number;
  notes?: string | null;
  bankAccountsHtml?: string;
};

export type ParsedInvoiceMeta = {
  lines: InvoicePdfLine[];
  discountCents: number;
  vatRatePercent?: number;
  notes?: string | null;
};

export function parseInvoiceDocument(
  lineItemsJson: string | null | undefined,
  orderItems: Array<{
    productName: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>,
  orderDiscountCents = 0
): ParsedInvoiceMeta {
  if (lineItemsJson) {
    try {
      const parsed = JSON.parse(lineItemsJson) as
        | InvoicePdfLine[]
        | { lines?: InvoicePdfLine[]; discountCents?: number; vatRatePercent?: number; notes?: string | null };

      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          lines: parsed.map((l) => ({
            description: l.description || "Item",
            qty: l.qty || 1,
            unitCents: l.unitCents || 0,
            discountCents: l.discountCents || 0,
          })),
          discountCents: orderDiscountCents,
        };
      }

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        "lines" in parsed &&
        Array.isArray(parsed.lines) &&
        parsed.lines.length > 0
      ) {
        return {
          lines: parsed.lines.map((l: InvoicePdfLine) => ({
            description: l.description || "Item",
            qty: l.qty || 1,
            unitCents: l.unitCents || 0,
            discountCents: l.discountCents || 0,
          })),
          discountCents: parsed.discountCents ?? orderDiscountCents,
          vatRatePercent: parsed.vatRatePercent,
          notes: parsed.notes,
        };
      }
    } catch {
      /* fall through */
    }
  }

  return {
    lines: orderItems.map((i) => ({
      description: i.productName,
      qty: i.quantity,
      unitCents: i.unitPriceCents,
      discountCents: Math.max(0, i.quantity * i.unitPriceCents - i.totalCents),
    })),
    discountCents: orderDiscountCents,
  };
}

export function parseInvoiceLines(
  lineItemsJson: string | null | undefined,
  orderItems: Array<{
    productName: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>,
  orderDiscountCents = 0
): InvoicePdfLine[] {
  return parseInvoiceDocument(lineItemsJson, orderItems, orderDiscountCents).lines;
}

export function lineTotalCents(line: InvoicePdfLine) {
  return line.qty * line.unitCents - (line.discountCents || 0);
}

export function buildInvoicePdfHtml(data: InvoicePdfData): string {
  const balanceCents =
    data.remainingBalanceCents ?? Math.max(0, data.totalCents - data.paidCents);
  const advanceCents = data.advancePaymentsCents ?? 0;
  const discountCents = data.discountCents ?? 0;
  const taxable = Math.max(0, data.subtotalCents - discountCents);
  const vatPct =
    data.vatRatePercent ??
    (taxable > 0 ? Math.round((data.taxCents / taxable) * 100) : 18);

  const lineRows = data.lines
    .map((line) => {
      const total = lineTotalCents(line);
      return `<tr>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${line.qty}</td>
        <td class="num">${formatMoney(line.unitCents, data.currency)}</td>
        <td class="num">${formatMoney(total, data.currency)}</td>
      </tr>`;
    })
    .join("");

  const issued = new Date(data.createdAt).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const due = data.dueAt
    ? new Date(data.dueAt).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(data.invoiceNumber)} — MernCrest Solutions</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
    }
    .toolbar {
      padding: 12px 20px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }
    .toolbar button {
      background: #7c3aed;
      color: #fff;
      border: 0;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      cursor: pointer;
    }
    .content { padding: 32px; }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 28px;
    }
    .brand h1 {
      margin: 0;
      font-size: 26px;
      color: #7c3aed;
      letter-spacing: -0.02em;
    }
    .brand p { margin: 6px 0 0; color: #64748b; font-size: 13px; }
    .meta {
      text-align: right;
      font-size: 13px;
      color: #475569;
    }
    .meta strong { display: block; color: #0f172a; font-size: 18px; margin-bottom: 6px; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }
    .card h3 {
      margin: 0 0 10px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7c3aed;
    }
    .card p { margin: 0; font-size: 14px; line-height: 1.5; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      padding: 10px 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      vertical-align: top;
    }
    .num { text-align: right; white-space: nowrap; }
    .totals {
      margin-left: auto;
      width: min(320px, 100%);
      font-size: 14px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      color: #475569;
    }
    .totals .row.total {
      border-top: 2px solid #7c3aed;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .totals .row.balance {
      color: #b45309;
      font-weight: 600;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: #ede9fe;
      color: #7c3aed;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page { border: 0; box-shadow: none; border-radius: 0; }
      .toolbar { display: none; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="toolbar">
      <button type="button" onclick="window.print()">Print / Save PDF</button>
    </div>
    <div class="content">
      <div class="header">
        <div class="brand">
          <h1>MernCrest Solutions</h1>
          <p>Enterprise Technology · Software · AI · Cloud Consulting</p>
        </div>
        <div class="meta">
          <strong>Tax Invoice</strong>
          <div>${escapeHtml(data.invoiceNumber)}</div>
          <div>Issued: ${issued}</div>
          ${due ? `<div>Due: ${due}</div>` : ""}
          <div style="margin-top:8px"><span class="status">${escapeHtml(data.status)}</span></div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Bill to</h3>
          <p>
            <strong>${escapeHtml(data.customer.fullName)}</strong><br/>
            ${escapeHtml(data.customer.email)}<br/>
            ${data.customer.company ? `${escapeHtml(data.customer.company)}<br/>` : ""}
            ${data.customer.address ? `${escapeHtml(data.customer.address)}<br/>` : ""}
            ${data.customer.country ? escapeHtml(data.customer.country) : ""}
          </p>
        </div>
        <div class="card">
          <h3>Order details</h3>
          <p>
            Order: <strong>${escapeHtml(data.orderNumber)}</strong><br/>
            Currency: ${escapeHtml(data.currency)}<br/>
            ${data.paidCents > 0 ? `Paid: ${formatMoney(data.paidCents, data.currency)}<br/>` : ""}
            ${balanceCents > 0 && data.paidCents > 0 ? `Balance due: ${formatMoney(balanceCents, data.currency)}` : ""}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Qty</th>
            <th class="num">Unit price</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineRows || `<tr><td colspan="4">No line items</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${formatMoney(data.subtotalCents, data.currency)}</span></div>
        ${
          discountCents > 0
            ? `<div class="row"><span>Discount</span><span>-${formatMoney(discountCents, data.currency)}</span></div>`
            : ""
        }
        <div class="row"><span>VAT (${vatPct}%)</span><span>${formatMoney(data.taxCents, data.currency)}</span></div>
        <div class="row total"><span>Total</span><span>${formatMoney(data.totalCents, data.currency)}</span></div>
        ${
          advanceCents > 0
            ? `<div class="row"><span>Advance received</span><span>${formatMoney(advanceCents, data.currency)}</span></div>`
            : ""
        }
        ${
          data.paidCents > 0
            ? `<div class="row"><span>Total paid</span><span>${formatMoney(data.paidCents, data.currency)}</span></div>
               <div class="row balance"><span>Balance due</span><span>${formatMoney(balanceCents, data.currency)}</span></div>`
            : balanceCents > 0
              ? `<div class="row balance"><span>Amount due</span><span>${formatMoney(balanceCents, data.currency)}</span></div>`
              : ""
        }
      </div>

      ${
        data.notes
          ? `<div class="card" style="margin-top:20px"><h3>Notes &amp; payment terms</h3><p>${escapeHtml(data.notes)}</p></div>`
          : ""
      }

      <div class="footer">
        <strong>MernCrest Solutions (Pvt) Ltd</strong> · merncrest.lk · Colombo, Sri Lanka<br/>
        ${data.bankAccountsHtml || "Payment by bank transfer — include invoice number <strong>" + escapeHtml(data.invoiceNumber) + "</strong> as reference."}<br/>
        <span style="margin-top:12px;display:block;color:#94a3b8">Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
