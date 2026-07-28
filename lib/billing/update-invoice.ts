import type { Prisma } from "@prisma/client";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
import { vatRatePercent } from "@/lib/billing/vat";
import { SL_TIMEZONE } from "@/lib/timezone";

export type InvoiceLineInput = {
  description: string;
  qty: number;
  unitCents: number;
  discountCents?: number;
};

type Tx = Prisma.TransactionClient;

function isOverdue(dueAt: Date | string | null): boolean {
  if (!dueAt) return false;
  const due = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const nowStr = new Date().toLocaleString("en-US", { timeZone: SL_TIMEZONE });
  const dueStr = due.toLocaleString("en-US", { timeZone: SL_TIMEZONE });
  return new Date(dueStr).getTime() < new Date(nowStr).getTime();
}

/** Derive invoice status from payments vs total (owner/admin full edit). */
export function deriveInvoiceStatusFromPayments(
  paidCents: number,
  totalCents: number,
  dueAt: Date | string | null,
  explicitStatus?: string
): { status: string; paidAt: Date | null } {
  const explicit = explicitStatus?.toUpperCase();
  if (explicit === "VOID" || explicit === "CANCELLED") {
    return { status: explicit, paidAt: null };
  }

  if (paidCents >= totalCents && totalCents > 0) {
    return { status: "PAID", paidAt: new Date() };
  }

  if (paidCents > 0) {
    return { status: "PARTIALLY_PAID", paidAt: null };
  }

  if (explicit && explicit !== "PAID" && explicit !== "PARTIALLY_PAID") {
    if (explicit === "OVERDUE" || explicit === "SENT" || explicit === "DRAFT") {
      return { status: explicit, paidAt: null };
    }
    return { status: explicit, paidAt: null };
  }

  if (isOverdue(dueAt)) {
    return { status: "OVERDUE", paidAt: null };
  }

  return { status: explicit ?? "SENT", paidAt: null };
}

export async function applyInvoiceLineUpdate(
  tx: Tx,
  invoice: {
    id: string;
    orderId: string;
    paidCents: number;
    lineItemsJson: string | null;
    dueAt?: Date | string | null;
  },
  lineItems: InvoiceLineInput[],
  options?: {
    discountCents?: number;
    taxCents?: number;
    vatRatePercent?: number;
    notes?: string;
    updatedBy?: string;
    explicitStatus?: string;
    advanceCents?: number;
  }
) {
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
    ...(options?.advanceCents != null ? { advanceCents: options.advanceCents } : {}),
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
      ...(invoice.paidCents >= totals.totalCents
        ? { status: "PAID" }
        : invoice.paidCents > 0
          ? { status: "WAITING_PAYMENT" }
          : {}),
    },
  });

  const dueAt = invoice.dueAt ?? null;
  const { status, paidAt } = deriveInvoiceStatusFromPayments(
    invoice.paidCents,
    totals.totalCents,
    dueAt,
    options?.explicitStatus
  );

  await tx.invoice.update({
    where: { id: invoice.id },
    data: {
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      lineItemsJson,
      status,
      paidAt,
      ...(options?.updatedBy ? { updatedBy: options.updatedBy } : {}),
    },
  });

  const schedules = await tx.projectPaymentSchedule.findMany({
    where: { invoiceId: invoice.id },
    select: { id: true, status: true },
  });

  for (const schedule of schedules) {
    let scheduleStatus = schedule.status;
    if (invoice.paidCents >= totals.totalCents) {
      scheduleStatus = "PAID";
    } else if (schedule.status === "PAID") {
      scheduleStatus = "INVOICED";
    }

    await tx.projectPaymentSchedule.update({
      where: { id: schedule.id },
      data: {
        amountCents: totals.totalCents,
        status: scheduleStatus,
        paidAt: scheduleStatus === "PAID" ? new Date() : null,
      },
    });
  }

  return { ...totals, status, paidAt };
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
