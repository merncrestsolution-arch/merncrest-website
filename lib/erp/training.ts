import { prisma } from "@/lib/db";

export async function trainingRoi(days = 90) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const records = await prisma.trainingRecord.findMany({
    where: { createdAt: { gte: since } },
    take: 200,
  });
  const costCents = records.reduce((a, r) => a + (r.costCents || 0), 0);
  const hours = records.reduce((a, r) => a + (r.hours || 0), 0);
  const completed = records.filter((r) => r.status === "COMPLETED").length;
  const avgScore =
    records.filter((r) => r.score != null).length > 0
      ? Math.round(
          (records.reduce((a, r) => a + (r.score || 0), 0) /
            records.filter((r) => r.score != null).length) *
            10
        ) / 10
      : null;

  // Proxy ROI: completed trainings * avg score vs cost (stub heuristic)
  const benefitScore = completed * (avgScore || 3) * 1000;
  const roiPct =
    costCents > 0 ? Math.round(((benefitScore - costCents) / costCents) * 1000) / 10 : null;

  return {
    days,
    records: records.length,
    completed,
    hours,
    costCents,
    avgScore,
    roiPct,
  };
}

export async function competencyMap(userId: string) {
  const assessments = await prisma.skillAssessment.findMany({
    where: { userId },
    orderBy: { assessedAt: "desc" },
    take: 50,
  });
  const bySkill = new Map<string, number>();
  for (const a of assessments) {
    if (!bySkill.has(a.skillKey)) bySkill.set(a.skillKey, a.score);
  }
  return Array.from(bySkill.entries()).map(([skillKey, score]) => ({ skillKey, score }));
}
