import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff, formatMoney } from "@/lib/commerce";
import { createInvoiceFromQuotation } from "@/lib/billing/quote-to-invoice";
import { recordInvoicePayment } from "@/lib/commerce/invoice-payments";
import { notifyClient } from "@/lib/notify/client-email";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "overview";

  if (view === "receipts") {
    const payments = await prisma.payment.findMany({
      where: { status: "SUCCEEDED" },
      include: {
        user: { select: { fullName: true, email: true } },
        invoice: { select: { invoiceNumber: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ payments });
  }

  const [customers, quotations, invoices, payments, openInvoices] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.quotation.count(),
    prisma.invoice.count(),
    prisma.payment.count({ where: { status: "SUCCEEDED" } }),
    prisma.invoice.count({
      where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
    }),
  ]);

  const recentInvoices = await prisma.invoice.findMany({
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const pendingQuotes = await prisma.quotation.count({
    where: { status: { in: ["PENDING_REVIEW", "DRAFT"] } },
  });

  const revenueCents = await prisma.payment.aggregate({
    where: { status: "SUCCEEDED" },
    _sum: { amountCents: true },
  });

  return NextResponse.json({
    stats: {
      customers,
      quotations,
      invoices,
      receipts: payments,
      openInvoices,
      pendingQuotes,
      revenueCents: revenueCents._sum.amountCents ?? 0,
    },
    recentInvoices,
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invoiceFromQuote"),
    quotationId: z.string(),
    dueDays: z.number().int().min(1).max(90).optional(),
    send: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("recordPayment"),
    invoiceId: z.string(),
    amountCents: z.number().int().positive(),
    method: z.string(),
    referenceNumber: z.string().optional(),
  }),
  z.object({
    action: z.literal("sendInvoice"),
    invoiceId: z.string(),
  }),
]);

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message =
      issue?.path[0] === "amountCents"
        ? "Payment amount must be greater than zero"
        : issue?.path[0] === "invoiceId"
          ? "Select an invoice"
          : issue?.message || "Invalid payment request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (parsed.data.action === "invoiceFromQuote") {
      const result = await createInvoiceFromQuotation({
        quotationId: parsed.data.quotationId,
        dueDays: parsed.data.dueDays,
        send: parsed.data.send,
      });
      return NextResponse.json({
        message: `Invoice ${result.invoice.invoiceNumber} created`,
        invoice: result.invoice,
        order: result.order,
      });
    }

    if (parsed.data.action === "recordPayment") {
      const invoice = await prisma.invoice.findUnique({
        where: { id: parsed.data.invoiceId },
      });
      if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      const result = await recordInvoicePayment({
        invoiceId: invoice.id,
        orderId: invoice.orderId,
        userId: invoice.userId,
        amountCents: parsed.data.amountCents,
        method: parsed.data.method,
        referenceNumber: parsed.data.referenceNumber,
        recordedById: auth.user.id,
      });
      return NextResponse.json({
        message: "Payment recorded — receipt available for download",
        payment: result.payment,
        invoice: result.invoice,
      });
    }

    if (parsed.data.action === "sendInvoice") {
      const invoice = await prisma.invoice.update({
        where: { id: parsed.data.invoiceId },
        data: { status: "SENT" },
        include: { user: { select: { fullName: true, email: true } } },
      });
      if (invoice.user.email) {
        void notifyClient("INVOICE_SENT", {
          toEmail: invoice.user.email,
          vars: {
            name: invoice.user.fullName,
            invoiceNumber: invoice.invoiceNumber,
            amount: formatMoney(invoice.totalCents),
          },
          recordedById: auth.user.id,
        });
      }
      return NextResponse.json({ message: "Invoice sent to customer", invoice });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 400 }
    );
  }
}
