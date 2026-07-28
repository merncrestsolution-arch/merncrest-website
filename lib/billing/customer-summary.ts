import type { PrismaClient } from "@prisma/client";
import { computeInvoiceFinancials } from "@/lib/billing/invoice-calculations";

export type CustomerBillingSummary = {
  invoicedCents: number;
  paidCents: number;
  balanceCents: number;
  invoiceCount: number;
  /** Sum of linked project contract values (revenueCents) */
  contractCents: number;
};

export async function getCustomerBillingSummaries(
  prisma: PrismaClient,
  userIds: string[]
): Promise<Map<string, CustomerBillingSummary>> {
  if (!userIds.length) return new Map();

  const empty = (): CustomerBillingSummary => ({
    invoicedCents: 0,
    paidCents: 0,
    balanceCents: 0,
    invoiceCount: 0,
    contractCents: 0,
  });

  const map = new Map(userIds.map((id) => [id, empty()]));

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: { in: userIds },
      deletedAt: null,
      status: { notIn: ["VOID", "CANCELLED"] },
    },
    include: {
      payments: {
        where: { deletedAt: null, status: "SUCCEEDED" },
        select: { amountCents: true, status: true, isAdvance: true },
      },
    },
  });

  const invoiceBalanceById = new Map<string, number>();

  for (const inv of invoices) {
    const summary = map.get(inv.userId);
    if (!summary) continue;

    const fin = computeInvoiceFinancials({
      totalCents: inv.totalCents,
      paidCents: inv.paidCents,
      status: inv.status,
      dueAt: inv.dueAt,
      lineItemsJson: inv.lineItemsJson,
      payments: inv.payments,
    });

    summary.invoiceCount += 1;
    summary.invoicedCents += fin.totalCents;
    summary.paidCents += fin.paidCents;
    summary.balanceCents += fin.remainingBalanceCents;
    invoiceBalanceById.set(inv.id, fin.remainingBalanceCents);
  }

  const projects = await prisma.erpProject.findMany({
    where: { customerId: { in: userIds } },
    select: {
      customerId: true,
      revenueCents: true,
      payments: {
        select: {
          amountCents: true,
          status: true,
          invoiceId: true,
        },
      },
    },
  });

  for (const project of projects) {
    if (!project.customerId) continue;
    const summary = map.get(project.customerId);
    if (!summary) continue;

    summary.contractCents += project.revenueCents;

    for (const schedule of project.payments) {
      if (schedule.status === "PAID" || schedule.status === "WAIVED") continue;

      if (schedule.invoiceId) {
        const invBalance = invoiceBalanceById.get(schedule.invoiceId);
        if (invBalance != null && invBalance > 0) continue;
      }

      summary.balanceCents += schedule.amountCents;
    }
  }

  return map;
}
