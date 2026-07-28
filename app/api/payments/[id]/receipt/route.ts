import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { buildReceiptPdfHtml } from "@/lib/billing/receipt-pdf-html";
import { resolveReceiptNumber } from "@/lib/commerce/org-numbers";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      ...(isStaffRole(user.role) ? {} : { userId: user.id }),
    },
    include: {
      user: { select: { fullName: true, email: true, company: true } },
      invoice: {
        select: {
          invoiceNumber: true,
          totalCents: true,
          paidCents: true,
        },
      },
      order: { select: { orderNumber: true } },
    },
  });

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.status !== "SUCCEEDED") {
    return NextResponse.json({ error: "Receipt only for confirmed payments" }, { status: 400 });
  }

  const receiptNumber = await resolveReceiptNumber(payment);
  const invoiceBalance =
    payment.invoice != null
      ? Math.max(0, payment.invoice.totalCents - payment.invoice.paidCents)
      : null;

  const html = buildReceiptPdfHtml({
    receiptNumber,
    paidAt: payment.paidAt || payment.createdAt,
    customerName: payment.user.fullName,
    customerEmail: payment.user.email,
    customerCompany: payment.user.company,
    invoiceNumber: payment.invoice?.invoiceNumber,
    orderNumber: payment.order?.orderNumber,
    amountCents: payment.amountCents,
    currency: payment.currency,
    method: payment.method,
    referenceNumber: payment.referenceNumber,
    invoiceTotalCents: payment.invoice?.totalCents,
    invoicePaidCents: payment.invoice?.paidCents,
    invoiceBalanceCents: invoiceBalance,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
