import { prisma } from "@/lib/db";
import { notifyClient } from "@/lib/notify/client-email";

/**
 * Record a payment against an invoice with running balance.
 * Rejects overpayment unless isCredit is true.
 */
export async function recordInvoicePayment(opts: {
  invoiceId: string;
  amountCents: number;
  method: string;
  userId: string;
  orderId: string;
  recordedById?: string;
  referenceNumber?: string;
  isCredit?: boolean;
  status?: string;
}) {
  if (opts.amountCents <= 0) throw new Error("Invalid amount");

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { id: opts.invoiceId } });
    if (!invoice) throw new Error("Invoice not found");

    const remaining = invoice.totalCents - invoice.paidCents;
    if (!opts.isCredit && opts.amountCents > remaining) {
      throw new Error("Amount exceeds remaining balance");
    }

    const payment = await tx.payment.create({
      data: {
        userId: opts.userId,
        orderId: opts.orderId,
        invoiceId: opts.invoiceId,
        amountCents: opts.amountCents,
        method: opts.method,
        status: opts.status || "SUCCEEDED",
        isCredit: opts.isCredit || false,
        recordedById: opts.recordedById || null,
        referenceNumber: opts.referenceNumber || null,
        paidAt: new Date(),
      },
    });

    const paidCents = invoice.paidCents + opts.amountCents;
    let status = invoice.status;
    if (paidCents >= invoice.totalCents) {
      status = "PAID";
    } else if (paidCents > 0) {
      status = "PARTIALLY_PAID";
    }

    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidCents,
        status,
        paidAt: paidCents >= invoice.totalCents ? new Date() : invoice.paidAt,
      },
    });

    return { payment, invoice: updated };
  }).then(async (result) => {
    const user = await prisma.user.findUnique({ where: { id: opts.userId } });
    if (user?.email) {
      await notifyClient("PAYMENT_RECEIVED", {
        toEmail: user.email,
        vars: {
          name: user.fullName,
          amount: (opts.amountCents / 100).toFixed(2),
          invoiceNumber: result.invoice.invoiceNumber,
        },
      });
    }
    return result;
  });
}
