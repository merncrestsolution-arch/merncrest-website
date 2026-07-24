import { prisma } from "@/lib/db";

export async function getIvrAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [total, byStatus, byDepartment, byUseCase, answered, missed, surveys, durationAgg, queue] =
    await Promise.all([
      prisma.callRecord.count({ where: { createdAt: { gte: since } } }),
      prisma.callRecord.groupBy({
        by: ["status"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.callRecord.groupBy({
        by: ["department"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _avg: { durationSec: true },
      }),
      prisma.callRecord.groupBy({
        by: ["useCase"],
        where: { createdAt: { gte: since }, useCase: { not: null } },
        _count: { _all: true },
      }),
      prisma.callRecord.count({
        where: { createdAt: { gte: since }, status: { in: ["ANSWERED", "COMPLETED"] } },
      }),
      prisma.callRecord.count({
        where: { createdAt: { gte: since }, status: { in: ["MISSED", "VOICEMAIL"] } },
      }),
      prisma.callRecord.aggregate({
        where: { createdAt: { gte: since }, surveyScore: { not: null } },
        _avg: { surveyScore: true },
        _count: { surveyScore: true },
      }),
      prisma.callRecord.aggregate({
        where: { createdAt: { gte: since } },
        _avg: { durationSec: true, holdSec: true },
        _sum: { durationSec: true },
      }),
      prisma.callRecord.count({
        where: { queueStatus: { in: ["QUEUED", "HOLD"] } },
      }),
    ]);

  const answerRate = total > 0 ? Math.round((answered / total) * 100) : 0;

  return {
    days,
    totals: {
      calls: total,
      answered,
      missed,
      queued: queue,
      answerRate,
      avgDurationSec: Math.round(durationAgg._avg.durationSec || 0),
      avgHoldSec: Math.round(durationAgg._avg.holdSec || 0),
      totalTalkSec: durationAgg._sum.durationSec || 0,
      avgSurvey: surveys._avg.surveyScore
        ? Math.round(surveys._avg.surveyScore * 10) / 10
        : null,
      surveyCount: surveys._count.surveyScore,
    },
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    byDepartment: byDepartment.map((r) => ({
      department: r.department,
      count: r._count._all,
      avgDurationSec: Math.round(r._avg.durationSec || 0),
    })),
    byUseCase: byUseCase.map((r) => ({
      useCase: r.useCase || "ROUTE",
      count: r._count._all,
    })),
  };
}
