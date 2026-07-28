/**
 * Issue invoices for project payment schedule rows that are still PENDING
 * without an invoice — e.g. final balance on completion.
 */
import type { PrismaClient } from "@prisma/client";
import { formatMoney } from "@/lib/commerce";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
import { linkInvoiceToSchedule } from "@/lib/billing/sync-payment-schedule";
import { vatRatePercent } from "@/lib/billing/vat";

export type IssueScheduleResult = {
  created: number;
  invoices: Array<{ invoiceNumber: string; amountCents: number; scheduleLabel: string }>;
};

export async function issueInvoicesForPendingSchedules(
  prisma: PrismaClient,
  options?: { projectId?: string; customerId?: string; actorId?: string }
): Promise<IssueScheduleResult> {
  const schedules = await prisma.projectPaymentSchedule.findMany({
    where: {
      status: "PENDING",
      invoiceId: null,
      ...(options?.projectId ? { projectId: options.projectId } : {}),
      ...(options?.customerId
        ? { project: { customerId: options.customerId } }
        : {}),
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectCode: true,
          customerId: true,
          customer: { select: { id: true, email: true, fullName: true } },
        },
      },
    },
    orderBy: [{ projectId: "asc" }, { sortOrder: "asc" }],
  });

  const created: IssueScheduleResult["invoices"] = [];
  const defaultVat = await vatRatePercent();

  for (const schedule of schedules) {
    const customerId = schedule.project.customerId;
    if (!customerId) continue;

    const lineSubtotal = schedule.amountCents;
    const totals = calcBillingTotals({
      lineSubtotalCents: lineSubtotal,
      defaultVatRatePercent: defaultVat,
    });

    if (totals.totalCents <= 0) continue;

    const orderNumber = await nextOrgNumber("ORDER");
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customerId,
        status: "WAITING_PAYMENT",
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
        currency: "LKR",
        items: {
          create: [{
            productName: schedule.label,
            productSlug: "project-schedule",
            quantity: 1,
            unitPriceCents: schedule.amountCents,
            totalCents: schedule.amountCents,
            billingPeriod: "ONCE",
          }],
        },
      },
    });

    const invoiceNumber = await nextOrgNumber("INVOICE");
    const dueAt = schedule.dueDate ?? new Date();

    await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          userId: customerId,
          projectId: schedule.projectId,
          status: "SENT",
          subtotalCents: totals.subtotalCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          paidCents: 0,
          currency: "LKR",
          lineItemsJson: JSON.stringify({
            lines: [{
              description: schedule.label,
              qty: 1,
              unitCents: schedule.amountCents,
            }],
            discountCents: totals.discountCents,
            vatRatePercent: totals.vatRatePercent,
            notes: `Project ${schedule.project.projectCode} — ${schedule.project.name}`,
          }),
          dueAt,
          createdBy: options?.actorId ?? null,
          updatedBy: options?.actorId ?? null,
        },
      });

      await linkInvoiceToSchedule(tx, schedule.projectId, inv.id, schedule.id);
    });

    created.push({
      invoiceNumber,
      amountCents: totals.totalCents,
      scheduleLabel: schedule.label,
    });
  }

  return { created: created.length, invoices: created };
}
