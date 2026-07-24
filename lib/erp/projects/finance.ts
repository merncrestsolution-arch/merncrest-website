import { prisma } from "@/lib/db";

/** Project P&L helpers */

export type ProjectFinanceInput = {
  budgetCents: number;
  spentCents: number;
  revenueCents: number;
  nextPaymentAt?: Date | string | null;
  nextPaymentCents?: number;
  expenses?: { amountCents: number }[];
  payments?: {
    amountCents: number;
    dueDate: Date | string;
    status: string;
  }[];
};

export function computeProjectFinance(p: ProjectFinanceInput) {
  const spentFromExpenses =
    p.expenses && p.expenses.length > 0
      ? p.expenses.reduce((a, e) => a + e.amountCents, 0)
      : p.spentCents;
  const spentCents = spentFromExpenses;
  const revenueCents = p.revenueCents || 0;
  const budgetCents = p.budgetCents || 0;
  const profitCents = revenueCents - spentCents;
  const budgetVarianceCents = budgetCents - spentCents;
  const marginPct =
    revenueCents > 0 ? Math.round((profitCents / revenueCents) * 1000) / 10 : null;

  const pending = (p.payments || [])
    .filter((x) => ["PENDING", "INVOICED", "OVERDUE"].includes(x.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const next = pending[0];
  const nextPaymentAt = next
    ? new Date(next.dueDate)
    : p.nextPaymentAt
      ? new Date(p.nextPaymentAt)
      : null;
  const nextPaymentCents = next ? next.amountCents : p.nextPaymentCents || 0;
  const overdue = pending.filter(
    (x) => new Date(x.dueDate) < new Date() && x.status !== "PAID"
  );

  return {
    budgetCents,
    spentCents,
    revenueCents,
    profitCents,
    budgetVarianceCents,
    marginPct,
    nextPaymentAt,
    nextPaymentCents,
    overdueCount: overdue.length,
    overdueCents: overdue.reduce((a, x) => a + x.amountCents, 0),
  };
}

export async function syncProjectSpent(projectId: string) {
  const agg = await prisma.projectExpense.aggregate({
    where: { projectId },
    _sum: { amountCents: true },
  });
  const spentCents = agg._sum.amountCents || 0;

  await prisma.projectPaymentSchedule.updateMany({
    where: {
      projectId,
      status: { in: ["PENDING", "INVOICED"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const nextPay = await prisma.projectPaymentSchedule.findFirst({
    where: {
      projectId,
      status: { in: ["PENDING", "INVOICED", "OVERDUE"] },
    },
    orderBy: { dueDate: "asc" },
  });

  return prisma.erpProject.update({
    where: { id: projectId },
    data: {
      spentCents,
      nextPaymentAt: nextPay?.dueDate || null,
      nextPaymentCents: nextPay?.amountCents || 0,
    },
  });
}
