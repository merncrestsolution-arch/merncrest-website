import type { PrismaClient } from "@prisma/client";

export type CustomerBillingSummary = {
  invoicedCents: number;
  paidCents: number;
  balanceCents: number;
  invoiceCount: number;
};

export async function getCustomerBillingSummaries(
  prisma: PrismaClient,
  userIds: string[]
): Promise<Map<string, CustomerBillingSummary>> {
  if (!userIds.length) return new Map();

  const rows = await prisma.invoice.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      status: { notIn: ["VOID", "CANCELLED"] },
    },
    _sum: { totalCents: true, paidCents: true },
    _count: true,
  });

  return new Map(
    rows.map((r) => {
      const invoicedCents = r._sum.totalCents ?? 0;
      const paidCents = r._sum.paidCents ?? 0;
      return [
        r.userId,
        {
          invoicedCents,
          paidCents,
          balanceCents: Math.max(0, invoicedCents - paidCents),
          invoiceCount: r._count,
        },
      ];
    })
  );
}
