import { prisma } from "@/lib/db";

export async function complaintAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [total, byStatus, bySeverity, byCategory, resolved] = await Promise.all([
    prisma.complaint.count({ where: { createdAt: { gte: since } } }),
    prisma.complaint.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.complaint.groupBy({
      by: ["severity"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.complaint.groupBy({
      by: ["category"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.complaint.findMany({
      where: { resolvedAt: { gte: since }, createdAt: { gte: since } },
      select: { createdAt: true, resolvedAt: true, csatScore: true },
      take: 200,
    }),
  ]);

  const resolutionHours = resolved
    .filter((c) => c.resolvedAt)
    .map((c) => (c.resolvedAt!.getTime() - c.createdAt.getTime()) / 3600000);
  const avgResolutionHrs =
    resolutionHours.length > 0
      ? Math.round(
          (resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length) * 10
        ) / 10
      : null;
  const avgCsat =
    resolved.filter((c) => c.csatScore != null).length > 0
      ? Math.round(
          (resolved.reduce((a, c) => a + (c.csatScore || 0), 0) /
            resolved.filter((c) => c.csatScore != null).length) *
            10
        ) / 10
      : null;

  const topCategories = [...byCategory]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5)
    .map((c) => ({
      category: c.category,
      count: c._count._all,
      prevention: `Review process for ${c.category}; add FAQ / training if recurring.`,
    }));

  return {
    days,
    total,
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    bySeverity: Object.fromEntries(bySeverity.map((r) => [r.severity, r._count._all])),
    avgResolutionHrs,
    avgCsat,
    trends: topCategories,
  };
}
