import { formatMoney } from "@/lib/commerce-format";
import { formatSriLankaDate } from "@/lib/timezone";

export type ProjectBillingHistoryInvoice = {
  invoiceNumber: string;
  status: string;
  issuedAt: Date | string;
  dueAt: Date | string | null;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
};

export type ProjectBillingHistoryPayment = {
  receiptNumber: string | null;
  paidAt: Date | string | null;
  amountCents: number;
  method: string;
  status: string;
  invoiceNumber: string | null;
};

export type ProjectBillingHistoryReceipt = {
  receiptNumber: string;
  paidAt: Date | string;
  amountCents: number;
  invoiceNumber: string | null;
  method: string;
};

export type ProjectBillingHistoryData = {
  projectName: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  generatedAt?: Date | string;
  invoices: ProjectBillingHistoryInvoice[];
  payments: ProjectBillingHistoryPayment[];
  receipts: ProjectBillingHistoryReceipt[];
  summary: {
    totalInvoicedCents: number;
    totalPaidCents: number;
    outstandingBalanceCents: number;
  };
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMethod(method: string) {
  return method
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildProjectBillingHistoryHtml(data: ProjectBillingHistoryData): string {
  const generatedAt = data.generatedAt ? new Date(data.generatedAt) : new Date();
  const currency = data.currency || "LKR";

  const invoiceRows = data.invoices
    .map((invoice) => {
      return `<tr>
        <td>${escapeHtml(invoice.invoiceNumber)}</td>
        <td>${escapeHtml(formatStatus(invoice.status))}</td>
        <td>${escapeHtml(formatSriLankaDate(invoice.issuedAt))}</td>
        <td>${invoice.dueAt ? escapeHtml(formatSriLankaDate(invoice.dueAt)) : "—"}</td>
        <td class="num">${formatMoney(invoice.totalCents, currency)}</td>
        <td class="num">${formatMoney(invoice.paidCents, currency)}</td>
        <td class="num">${formatMoney(invoice.balanceCents, currency)}</td>
      </tr>`;
    })
    .join("");

  const paymentRows = data.payments
    .map((payment) => {
      return `<tr>
        <td>${payment.receiptNumber ? escapeHtml(payment.receiptNumber) : "—"}</td>
        <td>${payment.paidAt ? escapeHtml(formatSriLankaDate(payment.paidAt)) : "—"}</td>
        <td>${payment.invoiceNumber ? escapeHtml(payment.invoiceNumber) : "—"}</td>
        <td>${escapeHtml(formatMethod(payment.method))}</td>
        <td>${escapeHtml(formatStatus(payment.status))}</td>
        <td class="num">${formatMoney(payment.amountCents, currency)}</td>
      </tr>`;
    })
    .join("");

  const receiptRows = data.receipts
    .map((receipt) => {
      return `<tr>
        <td>${escapeHtml(receipt.receiptNumber)}</td>
        <td>${escapeHtml(formatSriLankaDate(receipt.paidAt))}</td>
        <td>${receipt.invoiceNumber ? escapeHtml(receipt.invoiceNumber) : "—"}</td>
        <td>${escapeHtml(formatMethod(receipt.method))}</td>
        <td class="num">${formatMoney(receipt.amountCents, currency)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Project billing history — ${escapeHtml(data.projectName)}</title>
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
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
    }
    .content { padding: 32px; }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid #7c3aed;
    }
    .brand h1 {
      margin: 0;
      font-size: 22px;
      color: #7c3aed;
    }
    .brand p {
      margin: 6px 0 0;
      color: #64748b;
      font-size: 13px;
    }
    .meta {
      text-align: right;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }
    .summary-card span {
      display: block;
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .summary-card strong {
      font-size: 18px;
      color: #0f172a;
    }
    h2 {
      margin: 28px 0 12px;
      font-size: 16px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    td.num, th.num { text-align: right; white-space: nowrap; }
    .empty {
      color: #94a3b8;
      font-style: italic;
      padding: 12px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page { border: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="content">
      <div class="header">
        <div class="brand">
          <h1>Project billing history</h1>
          <p>${escapeHtml(data.projectName)}</p>
        </div>
        <div class="meta">
          <div><strong>Client:</strong> ${escapeHtml(data.clientName)}</div>
          <div>${escapeHtml(data.clientEmail)}</div>
          <div><strong>Generated:</strong> ${escapeHtml(formatSriLankaDate(generatedAt))}</div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-card">
          <span>Total invoiced</span>
          <strong>${formatMoney(data.summary.totalInvoicedCents, currency)}</strong>
        </div>
        <div class="summary-card">
          <span>Total paid</span>
          <strong>${formatMoney(data.summary.totalPaidCents, currency)}</strong>
        </div>
        <div class="summary-card">
          <span>Outstanding balance</span>
          <strong>${formatMoney(data.summary.outstandingBalanceCents, currency)}</strong>
        </div>
      </div>

      <h2>Invoices</h2>
      ${
        data.invoices.length > 0
          ? `<table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Status</th>
            <th>Issued</th>
            <th>Due</th>
            <th class="num">Total</th>
            <th class="num">Paid</th>
            <th class="num">Balance</th>
          </tr>
        </thead>
        <tbody>${invoiceRows}</tbody>
      </table>`
          : `<p class="empty">No invoices recorded for this project.</p>`
      }

      <h2>Payments</h2>
      ${
        data.payments.length > 0
          ? `<table>
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Date</th>
            <th>Invoice</th>
            <th>Method</th>
            <th>Status</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${paymentRows}</tbody>
      </table>`
          : `<p class="empty">No payments recorded for this project.</p>`
      }

      <h2>Receipts</h2>
      ${
        data.receipts.length > 0
          ? `<table>
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Date</th>
            <th>Invoice</th>
            <th>Method</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${receiptRows}</tbody>
      </table>`
          : `<p class="empty">No receipts issued for this project.</p>`
      }

      <div class="footer">
        <strong>MernCrest Solutions (Pvt) Ltd</strong> · merncrest.lk · Colombo, Sri Lanka<br/>
        <span style="margin-top:12px;display:block">Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
