import type { Prisma } from "@prisma/client";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
import { vatRatePercent } from "@/lib/billing/vat";

export type InvoiceLineInput = {
  description: string;
  qty: number;
  unitCents: number;
  discountCents?: number;
};

type Tx = Prisma.TransactionClient;

export async function applyInvoiceLineUpdate(
  tx: Tx,
  invoice: {
    id: string;
    orderId: string;
    paidCents: number;
    lineItemsJson: string | null;
  },
  lineItems: InvoiceLineInput[],
  options?: {
    discountCents?: number;
    taxCents?: number;
    vatRatePercent?: number;
    notes?: string;
    updatedBy?: string;
  }
) {
  if (invoice.paidCents > 0) {
    throw new Error("Cannot change line items on an invoice that has payments");
  }

  const lineSubtotal = lineItems.reduce(
    (s, l) => s + l.qty * l.unitCents - (l.discountCents || 0),
    0
  );

  const defaultVat = await vatRatePercent();
  const totals = calcBillingTotals({
    lineSubtotalCents: lineSubtotal,
    discountCents: options?.discountCents,
    taxCents: options?.taxCents,
    vatRatePercent: options?.vatRatePercent,
    defaultVatRatePercent: defaultVat,
  });

  if (totals.totalCents <= 0) {
    throw new Error("Invoice total must be greater than zero");
  }

  let meta: Record<string, unknown> = {};
  if (invoice.lineItemsJson) {
    try {
      meta = JSON.parse(invoice.lineItemsJson) as Record<string, unknown>;
    } catch {
      meta = {};
    }
  }

  const lineItemsJson = JSON.stringify({
    ...meta,
    lines: lineItems,
    discountCents: totals.discountCents,
    vatRatePercent: totals.vatRatePercent,
    notes: options?.notes ?? meta.notes ?? null,
  });

  await tx.orderItem.deleteMany({ where: { orderId: invoice.orderId } });
  await tx.orderItem.createMany({
    data: lineItems.map((l) => ({
      orderId: invoice.orderId,
      productName: l.description,
      productSlug: "manual-invoice",
      quantity: l.qty,
      unitPriceCents: l.unitCents,
      totalCents: l.qty * l.unitCents - (l.discountCents || 0),
      billingPeriod: "ONCE",
    })),
  });

  await tx.order.update({
    where: { id: invoice.orderId },
    data: {
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      discountCents: totals.discountCents,
      totalCents: totals.totalCents,
    },
  });

  await tx.invoice.update({
    where: { id: invoice.id },
    data: {
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      lineItemsJson,
      ...(options?.updatedBy ? { updatedBy: options.updatedBy } : {}),
    },
  });

  return totals;
}

export async function unlinkInvoiceSchedules(tx: Tx, invoiceId: string) {
  await tx.projectPaymentSchedule.updateMany({
    where: { invoiceId },
    data: {
      invoiceId: null,
      status: "PENDING",
      paidAt: null,
    },
  });
}
