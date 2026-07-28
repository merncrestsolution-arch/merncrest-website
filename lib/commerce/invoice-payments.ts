import { prisma } from "@/lib/db";
import { notifyClient } from "@/lib/notify/client-email";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import { syncProjectScheduleForPayment } from "@/lib/billing/sync-payment-schedule";

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
  isAdvance?: boolean;
  status?: string;
}) {
  if (opts.amountCents <= 0) throw new Error("Invalid amount");

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: opts.invoiceId },
    });
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.deletedAt) throw new Error("Invoice is archived");
    if (invoice.totalCents <= 0) {
      throw new Error(
        "Invoice total is zero — recreate the invoice with line-item prices before recording payment"
      );
    }

    const remaining = invoice.totalCents - invoice.paidCents;
    if (remaining <= 0 && !opts.isCredit) {
      throw new Error("Invoice is already fully paid");
    }
    if (!opts.isCredit && opts.amountCents > remaining) {
      throw new Error(`Amount exceeds remaining balance (${(remaining / 100).toLocaleString()} LKR)`);
    }

    const receiptNumber = await nextOrgNumber("RECEIPT");

    const payment = await tx.payment.create({
      data: {
        userId: opts.userId,
        orderId: opts.orderId,
        invoiceId: opts.invoiceId,
        receiptNumber,
        amountCents: opts.amountCents,
        method: opts.method,
        status: opts.status || "SUCCEEDED",
        isCredit: opts.isCredit || false,
        isAdvance: opts.isAdvance || false,
        recordedById: opts.recordedById || null,
        referenceNumber: opts.referenceNumber || null,
        createdBy: opts.recordedById || null,
        updatedBy: opts.recordedById || null,
        paidAt: new Date(),
      },
    });

    const paidCents = invoice.paidCents + opts.amountCents;
    const isFullyPaid = paidCents >= invoice.totalCents;
    let status = invoice.status;
    if (isFullyPaid) {
      status = "PAID";
    } else if (paidCents > 0) {
      status = "PARTIALLY_PAID";
    }

    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidCents,
        status,
        paidAt: isFullyPaid ? new Date() : invoice.paidAt,
        updatedBy: opts.recordedById || null,
      },
    });

    await syncProjectScheduleForPayment(tx, invoice.id, opts.amountCents, isFullyPaid);

    return { payment, invoice: updated };
  }).then(async (result) => {
    const user = await prisma.user.findUnique({ where: { id: opts.userId } });
    if (user?.email) {
      try {
        await notifyClient("PAYMENT_RECEIVED", {
          toEmail: user.email,
          vars: {
            name: user.fullName,
            amount: (opts.amountCents / 100).toFixed(2),
            invoiceNumber: result.invoice.invoiceNumber,
          },
        });
      } catch (err) {
        console.error("[recordInvoicePayment] notify failed:", err);
      }
    }
    return result;
  });
}
