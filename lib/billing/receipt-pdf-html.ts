import { formatMoney } from "@/lib/commerce-format";

export type ReceiptPdfData = {
  receiptNumber: string;
  paidAt: Date | string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string | null;
  amountCents: number;
  currency: string;
  method: string;
  referenceNumber?: string | null;
  invoiceNumber?: string | null;
  orderNumber?: string | null;
  invoiceTotalCents?: number | null;
  invoicePaidCents?: number | null;
  invoiceBalanceCents?: number | null;
};

function formatMethod(method: string) {
  return method
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildReceiptPdfHtml(data: ReceiptPdfData): string {
  const paidOn = new Date(data.paidAt).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paidTime = new Date(data.paidAt).toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasInvoice =
    data.invoiceNumber &&
    data.invoiceTotalCents != null &&
    data.invoiceTotalCents > 0;

  const previousPaid =
    hasInvoice && data.invoicePaidCents != null
      ? Math.max(0, data.invoicePaidCents - data.amountCents)
      : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(data.receiptNumber)} — MernCrest Solutions</title>
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
      background: #0e7490;
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
      align-items: flex-start;
    }
    .brand h1 {
      margin: 0;
      font-size: 26px;
      color: #0e7490;
      letter-spacing: -0.02em;
    }
    .brand p { margin: 6px 0 0; color: #64748b; font-size: 13px; }
    .meta {
      text-align: right;
      font-size: 13px;
      color: #475569;
    }
    .meta strong {
      display: block;
      color: #0f172a;
      font-size: 18px;
      margin-bottom: 6px;
    }
    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: #ecfdf5;
      color: #047857;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
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
      color: #0e7490;
    }
    .card p { margin: 0; font-size: 14px; line-height: 1.5; }
    .amount-box {
      background: linear-gradient(135deg, #ecfeff 0%, #f0fdf4 100%);
      border: 1px solid #99f6e4;
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .amount-box .label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0e7490;
      font-weight: 600;
    }
    .amount-box .value {
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .amount-box .sub {
      width: 100%;
      font-size: 12px;
      color: #64748b;
      margin-top: -4px;
    }
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
      width: 38%;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      vertical-align: top;
      font-weight: 500;
    }
    .totals {
      margin-left: auto;
      width: min(360px, 100%);
      font-size: 14px;
      margin-bottom: 8px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      color: #475569;
    }
    .totals .row.highlight {
      border-top: 2px solid #0e7490;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #047857;
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
    @media print {
      body { background: #fff; padding: 0; }
      .page { border: 0; box-shadow: none; border-radius: 0; }
      .toolbar { display: none; }
      .content { padding: 20px; }
    }
    @media (max-width: 640px) {
      .grid { grid-template-columns: 1fr; }
      .header { flex-direction: column; }
      .meta { text-align: left; }
      .amount-box .value { font-size: 26px; }
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
          <strong>Payment Receipt</strong>
          <div>${escapeHtml(data.receiptNumber)}</div>
          <div>${paidOn} · ${paidTime}</div>
          <span class="status">Payment received</span>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Received from</h3>
          <p>
            <strong>${escapeHtml(data.customerName)}</strong><br/>
            ${escapeHtml(data.customerEmail)}
            ${data.customerCompany ? `<br/>${escapeHtml(data.customerCompany)}` : ""}
          </p>
        </div>
        <div class="card">
          <h3>Payment details</h3>
          <p>
            Method: <strong>${escapeHtml(formatMethod(data.method))}</strong><br/>
            Currency: ${escapeHtml(data.currency)}
            ${data.referenceNumber ? `<br/>Reference: <strong>${escapeHtml(data.referenceNumber)}</strong>` : ""}
          </p>
        </div>
      </div>

      <div class="amount-box">
        <div>
          <div class="label">Amount received</div>
          <div class="sub">Official confirmation of payment credited to your account</div>
        </div>
        <div class="value">${formatMoney(data.amountCents, data.currency)}</div>
      </div>

      <table>
        <tbody>
          ${
            data.invoiceNumber
              ? `<tr><th>Invoice</th><td>${escapeHtml(data.invoiceNumber)}</td></tr>`
              : ""
          }
          ${
            data.orderNumber
              ? `<tr><th>Order</th><td>${escapeHtml(data.orderNumber)}</td></tr>`
              : ""
          }
          <tr><th>Payment method</th><td>${escapeHtml(formatMethod(data.method))}</td></tr>
          ${
            data.referenceNumber
              ? `<tr><th>Bank / transaction reference</th><td>${escapeHtml(data.referenceNumber)}</td></tr>`
              : ""
          }
          <tr><th>Receipt number</th><td>${escapeHtml(data.receiptNumber)}</td></tr>
          <tr><th>Date & time</th><td>${paidOn} at ${paidTime}</td></tr>
        </tbody>
      </table>

      ${
        hasInvoice
          ? `<div class="totals">
              <div class="row"><span>Invoice total</span><span>${formatMoney(data.invoiceTotalCents!, data.currency)}</span></div>
              ${
                previousPaid != null && previousPaid > 0
                  ? `<div class="row"><span>Previously paid</span><span>${formatMoney(previousPaid, data.currency)}</span></div>`
                  : ""
              }
              <div class="row highlight"><span>This payment</span><span>${formatMoney(data.amountCents, data.currency)}</span></div>
              ${
                data.invoiceBalanceCents != null
                  ? `<div class="row balance"><span>Remaining balance</span><span>${formatMoney(data.invoiceBalanceCents, data.currency)}</span></div>`
                  : ""
              }
            </div>`
          : ""
      }

      <div class="footer">
        <strong>MernCrest Solutions (Pvt) Ltd</strong> · merncrest.lk · Colombo, Sri Lanka<br/>
        This document confirms that MernCrest Solutions has received the payment listed above.
        Please retain this receipt for your records.
        ${
          data.invoiceNumber
            ? `<br/>For billing enquiries, quote invoice <strong>${escapeHtml(data.invoiceNumber)}</strong> or receipt <strong>${escapeHtml(data.receiptNumber)}</strong>.`
            : ""
        }
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
