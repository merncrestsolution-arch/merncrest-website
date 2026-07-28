import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import {
  buildInvoicePdfHtml,
  parseInvoiceDocument,
} from "@/lib/billing/invoice-pdf-html";
import { buildBankAccountsHtml } from "@/lib/billing/invoice-pdf-banks";
import { computeInvoiceFinancials } from "@/lib/billing/invoice-calculations";

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
      deletedAt: null,
      ...(isStaffRole(user.role) ? {} : { userId: user.id }),
    },
    include: {
      order: { include: { items: true, user: true } },
      user: true,
      payments: {
        where: { deletedAt: null, status: "SUCCEEDED" },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const registrant = invoice.order.registrantJson
    ? (JSON.parse(invoice.order.registrantJson) as Record<string, string>)
    : {};

  const doc = parseInvoiceDocument(
    invoice.lineItemsJson,
    invoice.order.items,
    invoice.order.discountCents ?? 0
  );

  const financials = computeInvoiceFinancials({
    totalCents: invoice.totalCents,
    paidCents: invoice.paidCents,
    status: invoice.status,
    dueAt: invoice.dueAt,
    lineItemsJson: invoice.lineItemsJson,
    payments: invoice.payments.map((p) => ({
      amountCents: p.amountCents,
      status: p.status,
      isAdvance: p.isAdvance,
    })),
  });

  const html = buildInvoicePdfHtml({
    invoiceNumber: invoice.invoiceNumber,
    status: financials.effectiveStatus,
    currency: invoice.currency,
    subtotalCents: invoice.subtotalCents,
    discountCents: doc.discountCents,
    taxCents: invoice.taxCents,
    totalCents: invoice.totalCents,
    paidCents: financials.paidCents,
    advancePaymentsCents: financials.advancePaymentsCents,
    remainingBalanceCents: financials.remainingBalanceCents,
    dueAmountCents: financials.dueAmountCents,
    createdAt: invoice.createdAt,
    dueAt: invoice.dueAt,
    orderNumber: invoice.order.orderNumber,
    customer: {
      fullName: invoice.user.fullName,
      email: invoice.user.email,
      company: registrant.companyName || invoice.user.company,
      address: registrant.address,
      country: registrant.country,
    },
    lines: doc.lines,
    vatRatePercent: doc.vatRatePercent,
    notes: doc.notes,
    bankAccountsHtml: buildBankAccountsHtml(),
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
