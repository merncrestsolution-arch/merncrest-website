import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { buildReceiptPdf } from "@/lib/crm/receipt-pdf";

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
      user: { select: { fullName: true, email: true } },
      invoice: { select: { invoiceNumber: true } },
      order: { select: { orderNumber: true } },
    },
  });

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.status !== "SUCCEEDED") {
    return NextResponse.json({ error: "Receipt only for confirmed payments" }, { status: 400 });
  }

  const receiptNumber = `RCP-${payment.id.slice(-8).toUpperCase()}`;
  const bytes = await buildReceiptPdf({
    receiptNumber,
    paidAt: payment.paidAt || payment.createdAt,
    customerName: payment.user.fullName,
    customerEmail: payment.user.email,
    invoiceNumber: payment.invoice?.invoiceNumber,
    orderNumber: payment.order.orderNumber,
    amountCents: payment.amountCents,
    currency: payment.currency,
    method: payment.method,
    referenceNumber: payment.referenceNumber,
  });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receiptNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
