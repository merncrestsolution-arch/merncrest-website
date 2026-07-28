import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff, formatMoney } from "@/lib/commerce";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import { recordInvoicePayment } from "@/lib/commerce/invoice-payments";
import { notifyClient } from "@/lib/notify/client-email";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
import { vatRatePercent } from "@/lib/billing/vat";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const invoices = await prisma.invoice.findMany({
    where: userId ? { userId } : undefined,
    include: {
      user: { select: { fullName: true, email: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const invoiceRows = invoices.map((inv) => ({
    ...inv,
    balanceCents: Math.max(0, inv.totalCents - inv.paidCents),
  }));
  return NextResponse.json({ invoices: invoiceRows, vatRatePercent: await vatRatePercent() });
}

const lineSchema = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unitCents: z.number().int().positive("Each line item must have a unit price greater than zero"),
  discountCents: z.number().int().nonnegative().optional(),
});

const createSchema = z.object({
  userId: z.string(),
  orderId: z.string().optional(),
  lineItems: z.array(lineSchema).min(1),
  dueDays: z.number().int().min(0).max(120).optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
  discountCents: z.number().int().nonnegative().optional(),
  taxCents: z.number().int().nonnegative().optional(),
  vatRatePercent: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "payment") {
    const paySchema = z.object({
      invoiceId: z.string(),
      amountCents: z.number().int().positive(),
      method: z.string(),
      isCredit: z.boolean().optional(),
      isAdvance: z.boolean().optional(),
      referenceNumber: z.string().optional(),
    });
    const parsed = paySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
    }
    const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId } });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
      const result = await recordInvoicePayment({
        invoiceId: invoice.id,
        orderId: invoice.orderId,
        userId: invoice.userId,
        amountCents: parsed.data.amountCents,
        method: parsed.data.method,
        isCredit: parsed.data.isCredit,
        isAdvance: parsed.data.isAdvance,
        referenceNumber: parsed.data.referenceNumber,
        recordedById: auth.user.id,
      });
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Payment failed" },
        { status: 400 }
      );
    }
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ||
      parsed.error.issues[0]?.path.join(".") ||
      "Invalid invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const defaultVat = await vatRatePercent();
  const lineSubtotal = parsed.data.lineItems.reduce((s, l) => {
    return s + l.qty * l.unitCents - (l.discountCents || 0);
  }, 0);

  const totals = calcBillingTotals({
    lineSubtotalCents: lineSubtotal,
    discountCents: parsed.data.discountCents,
    taxCents: parsed.data.taxCents,
    vatRatePercent: parsed.data.vatRatePercent,
    defaultVatRatePercent: defaultVat,
  });

  if (totals.totalCents <= 0) {
    return NextResponse.json(
      { error: "Invoice total must be greater than zero — check line items, discount, and tax" },
      { status: 400 }
    );
  }

  const { subtotalCents, discountCents, taxCents, totalCents } = totals;

  let orderId = parsed.data.orderId;
  if (!orderId) {
    const orderNumber = await nextOrgNumber("ORDER");
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "WAITING_PAYMENT",
        subtotalCents,
        taxCents,
        discountCents,
        totalCents,
        currency: "LKR",
        items: {
          create: parsed.data.lineItems.map((l) => ({
            productName: l.description,
            productSlug: "manual-invoice",
            quantity: l.qty,
            unitPriceCents: l.unitCents,
            totalCents: l.qty * l.unitCents - (l.discountCents || 0),
            billingPeriod: "ONCE",
          })),
        },
      },
    });
    orderId = order.id;
  }

  const invoiceNumber = await nextOrgNumber("INVOICE");
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + (parsed.data.dueDays ?? 14));

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      userId: user.id,
      status: parsed.data.status || "DRAFT",
      subtotalCents,
      taxCents,
      totalCents,
      paidCents: 0,
      currency: "LKR",
      lineItemsJson: JSON.stringify({
        lines: parsed.data.lineItems,
        discountCents,
        vatRatePercent: totals.vatRatePercent,
        notes: parsed.data.notes || null,
      }),
      dueAt,
    },
  });

  if (invoice.status === "SENT" && user.email) {
    void notifyClient("INVOICE_SENT", {
      toEmail: user.email,
      vars: {
        name: user.fullName,
        invoiceNumber: invoice.invoiceNumber,
        amount: formatMoney(totalCents),
      },
      recordedById: auth.user.id,
    });
  }

  return NextResponse.json({ invoice });
}
