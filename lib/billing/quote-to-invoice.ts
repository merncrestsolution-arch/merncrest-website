import { prisma } from "@/lib/db";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";

/** Convert an accepted or sent quotation into an order + invoice for billing. */
export async function createInvoiceFromQuotation(opts: {
  quotationId: string;
  dueDays?: number;
  send?: boolean;
}) {
  const quote = await prisma.quotation.findUnique({
    where: { id: opts.quotationId },
    include: { items: true },
  });
  if (!quote) throw new Error("Quotation not found");
  if (!quote.items.length) throw new Error("Quotation has no line items");
  if (quote.orderId) throw new Error("Quotation already converted to an order");

  let userId = quote.userId;
  if (!userId) {
    const existing = await prisma.user.findFirst({
      where: { email: quote.customerEmail.toLowerCase() },
    });
    if (existing) {
      userId = existing.id;
    } else {
      throw new Error(
        "Link a portal customer first — no account found for this email. Create the client or assign userId on the quote."
      );
    }
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + (opts.dueDays ?? 14));

  return prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrgNumber("ORDER");
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: "WAITING_PAYMENT",
        subtotalCents: quote.subtotalCents,
        taxCents: quote.taxCents,
        discountCents: quote.discountCents,
        totalCents: quote.totalCents,
        currency: quote.currency,
        notes: `From quotation ${quote.quoteNumber}`,
        items: {
          create: quote.items.map((i) => ({
            productName: i.description,
            productSlug: "quotation-line",
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            totalCents: i.totalCents,
            billingPeriod: "ONCE",
          })),
        },
      },
    });

    const invoiceNumber = await nextOrgNumber("INVOICE");
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        userId,
        status: opts.send ? "SENT" : "DRAFT",
        subtotalCents: quote.subtotalCents,
        taxCents: quote.taxCents,
        totalCents: quote.totalCents,
        paidCents: 0,
        currency: quote.currency,
        lineItemsJson: JSON.stringify(
          quote.items.map((i) => ({
            description: i.description,
            qty: i.quantity,
            unitCents: i.unitPriceCents,
          }))
        ),
        dueAt,
      },
    });

    await tx.quotation.update({
      where: { id: quote.id },
      data: { orderId: order.id, userId, status: quote.status === "ACCEPTED" ? "ACCEPTED" : quote.status },
    });

    if (quote.leadId) {
      await tx.crmActivity.create({
        data: {
          leadId: quote.leadId,
          type: "STATUS",
          body: `Quotation ${quote.quoteNumber} → invoice ${invoice.invoiceNumber}`,
        },
      });
    }

    return { order, invoice, quotation: quote };
  });
}
