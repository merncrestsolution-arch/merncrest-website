import { prisma } from "@/lib/db";
import { requireStaff, formatMoney } from "@/lib/commerce";
import { apiError } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { getStaffScope, invoiceScopeWhere } from "@/lib/erp/staff-scope";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Printable finance summary report (HTML) — view in app without download. */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "billing.view");
  if (!canView) return apiError("FORBIDDEN", "Missing billing.view permission", 403);

  const scope = await getStaffScope(auth.user);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { deletedAt: null, ...invoiceScopeWhere(scope) },
      select: {
        invoiceNumber: true,
        status: true,
        totalCents: true,
        paidCents: true,
        createdAt: true,
        user: { select: { fullName: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: "SUCCEEDED",
        createdAt: { gte: monthStart },
        invoice: { deletedAt: null, ...invoiceScopeWhere(scope) },
      },
      select: {
        receiptNumber: true,
        amountCents: true,
        method: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const invoicedCents = invoices.reduce((s, i) => s + i.totalCents, 0);
  const collectedCents = invoices.reduce((s, i) => s + i.paidCents, 0);
  const outstandingCents = invoices.reduce((s, i) => s + Math.max(0, i.totalCents - i.paidCents), 0);
  const monthCollected = payments.reduce((s, p) => s + p.amountCents, 0);

  const invoiceRows = invoices.slice(0, 40).map((inv) => {
    const balance = Math.max(0, inv.totalCents - inv.paidCents);
    const customer = inv.user.company || inv.user.fullName;
    return `<tr>
      <td>${escapeHtml(inv.invoiceNumber)}</td>
      <td>${escapeHtml(customer)}</td>
      <td>${escapeHtml(inv.status)}</td>
      <td style="text-align:right">${formatMoney(inv.totalCents)}</td>
      <td style="text-align:right">${formatMoney(inv.paidCents)}</td>
      <td style="text-align:right">${formatMoney(balance)}</td>
    </tr>`;
  });

  const paymentRows = payments.slice(0, 30).map((p) => {
    return `<tr>
      <td>${escapeHtml(p.receiptNumber || "—")}</td>
      <td>${escapeHtml(p.user.fullName)}</td>
      <td>${escapeHtml(p.method.replace(/_/g, " "))}</td>
      <td style="text-align:right">${formatMoney(p.amountCents)}</td>
      <td>${escapeHtml(new Date(p.createdAt).toLocaleDateString("en-LK"))}</td>
    </tr>`;
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Finance Report — MernCrest</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 16px; color: #0f172a; background: #fff; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
    .kpi label { font-size: 11px; color: #64748b; display: block; }
    .kpi strong { font-size: 16px; }
    h2 { font-size: 14px; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Finance Summary Report</h1>
  <p class="meta">Generated ${escapeHtml(now.toLocaleString("en-LK"))} · MernCrest Connect</p>
  <div class="kpis">
    <div class="kpi"><label>Total invoiced</label><strong>${formatMoney(invoicedCents)}</strong></div>
    <div class="kpi"><label>Collected</label><strong>${formatMoney(collectedCents)}</strong></div>
    <div class="kpi"><label>Outstanding</label><strong>${formatMoney(outstandingCents)}</strong></div>
    <div class="kpi"><label>This month collections</label><strong>${formatMoney(monthCollected)}</strong></div>
  </div>
  <h2>Recent invoices</h2>
  <table>
    <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead>
    <tbody>${invoiceRows.join("")}</tbody>
  </table>
  <h2>Payments this month</h2>
  <table>
    <thead><tr><th>Receipt</th><th>Customer</th><th>Method</th><th>Amount</th><th>Date</th></tr></thead>
    <tbody>${paymentRows.join("")}</tbody>
  </table>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
