import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce-format";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      ...(isStaffRole(user.role) ? {} : { userId: user.id }),
    },
    include: {
      order: { include: { items: true, user: true } },
      user: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const registrant = invoice.order.registrantJson
    ? (JSON.parse(invoice.order.registrantJson) as Record<string, string>)
    : {};

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${invoice.invoiceNumber}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#0B1622}
  h1{color:#0E7490} table{width:100%;border-collapse:collapse;margin-top:24px}
  th,td{text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;font-size:14px}
  .muted{color:#64748B;font-size:13px} .right{text-align:right}
  @media print{button{display:none}}
</style></head><body>
  <button onclick="window.print()">Print / Save PDF</button>
  <h1>MernCrest Solutions</h1>
  <p class="muted">Tax Invoice · ${invoice.invoiceNumber}</p>
  <p><strong>Bill to:</strong> ${invoice.user.fullName}<br/>
  ${invoice.user.email}<br/>
  ${registrant.companyName || invoice.user.company || ""}<br/>
  ${registrant.address || ""} ${registrant.country || ""}</p>
  <p class="muted">Order ${invoice.order.orderNumber} · Status ${invoice.status}<br/>
  Issued ${new Date(invoice.createdAt).toLocaleDateString()}
  ${invoice.dueAt ? ` · Due ${new Date(invoice.dueAt).toLocaleDateString()}` : ""}</p>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th class="right">Amount</th></tr></thead>
    <tbody>
      ${invoice.order.items
        .map(
          (i) =>
            `<tr><td>${i.productName}</td><td>${i.quantity}</td><td class="right">${formatMoney(i.totalCents, invoice.currency)}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>
  <p class="right"><strong>Subtotal:</strong> ${formatMoney(invoice.subtotalCents, invoice.currency)}<br/>
  <strong>Total:</strong> ${formatMoney(invoice.totalCents, invoice.currency)}</p>
  <p class="muted">MernCrest Solutions (Pvt) Ltd · merncrest.lk</p>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
