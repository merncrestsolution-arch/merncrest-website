import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff, formatMoney } from "@/lib/commerce";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import { recordInvoicePayment } from "@/lib/commerce/invoice-payments";
import { notifyClient } from "@/lib/notify/client-email";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

async function vatRatePercent(): Promise<number> {
  const orgId = await getPrimaryOrganizationId();
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "vat_rate_percent" },
  }).catch(() => null);
  if (setting?.value) {
    const n = Number(setting.value);
    if (!Number.isNaN(n)) return n;
  }
  void orgId;
  return Number(process.env.VAT_RATE_PERCENT || 18);
}

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
  return NextResponse.json({ invoices, vatRatePercent: await vatRatePercent() });
}

const lineSchema = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unitCents: z.number().int().nonnegative(),
  discountCents: z.number().int().nonnegative().optional(),
});

const createSchema = z.object({
  userId: z.string(),
  orderId: z.string().optional(),
  lineItems: z.array(lineSchema).min(1),
  dueDays: z.number().int().min(0).max(120).optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
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
    return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const vatPct = await vatRatePercent();
  const subtotal = parsed.data.lineItems.reduce((s, l) => {
    return s + l.qty * l.unitCents - (l.discountCents || 0);
  }, 0);
  const taxCents = Math.round(subtotal * (vatPct / 100));
  const totalCents = subtotal + taxCents;

  let orderId = parsed.data.orderId;
  if (!orderId) {
    const orderNumber = await nextOrgNumber("ORDER");
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "WAITING_PAYMENT",
        subtotalCents: subtotal,
        taxCents,
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
      subtotalCents: subtotal,
      taxCents,
      totalCents,
      paidCents: 0,
      currency: "LKR",
      lineItemsJson: JSON.stringify(parsed.data.lineItems),
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
