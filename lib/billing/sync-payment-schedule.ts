import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/** Sync project payment schedule when invoice payments are recorded. */
export async function syncProjectScheduleForPayment(
  tx: Tx,
  invoiceId: string,
  amountCents: number,
  isFullyPaid: boolean
) {
  const schedules = await tx.projectPaymentSchedule.findMany({
    where: { invoiceId },
    orderBy: { sortOrder: "asc" },
  });

  if (!schedules.length) return;

  if (isFullyPaid) {
    await tx.projectPaymentSchedule.updateMany({
      where: { invoiceId },
      data: { status: "PAID", paidAt: new Date() },
    });
    return;
  }

  // Partial: mark first matching schedule as partially paid via notes, or INVOICED
  const primary = schedules[0];
  if (primary.status !== "PAID") {
    await tx.projectPaymentSchedule.update({
      where: { id: primary.id },
      data: {
        status: amountCents >= primary.amountCents ? "PAID" : "INVOICED",
        paidAt: amountCents >= primary.amountCents ? new Date() : null,
      },
    });
  }
}

/** Link invoice to project schedule row when creating invoice from project. */
export async function linkInvoiceToSchedule(
  tx: Tx,
  projectId: string,
  invoiceId: string,
  scheduleId?: string
) {
  if (scheduleId) {
    await tx.projectPaymentSchedule.update({
      where: { id: scheduleId },
      data: { invoiceId, status: "INVOICED" },
    });
    return;
  }

  const next = await tx.projectPaymentSchedule.findFirst({
    where: { projectId, status: "PENDING" },
    orderBy: { sortOrder: "asc" },
  });
  if (next) {
    await tx.projectPaymentSchedule.update({
      where: { id: next.id },
      data: { invoiceId, status: "INVOICED" },
    });
  }
}
