import { prisma } from "@/lib/db";

/** Aggregate performance & analytics snapshot for System dashboards */
export async function buildPerformanceSnapshot(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    wonLeads,
    lostLeads,
    leadValue,
    openTickets,
    resolvedTickets,
    csat,
    attendance,
    lateAttendance,
    tasksDone,
    tasksOpen,
    revenue,
    expenses,
    audits,
  ] = await Promise.all([
    prisma.crmLead.count({ where: { stage: "WON", updatedAt: { gte: since } } }),
    prisma.crmLead.count({ where: { stage: "LOST", updatedAt: { gte: since } } }),
    prisma.crmLead.aggregate({
      where: { stage: "WON", updatedAt: { gte: since } },
      _avg: { valueCents: true },
      _sum: { valueCents: true },
    }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
    prisma.ticket.count({
      where: { status: { in: ["RESOLVED", "CLOSED"] }, closedAt: { gte: since } },
    }),
    prisma.customerSatisfaction.aggregate({
      where: { createdAt: { gte: since } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.attendanceRecord.count({ where: { workDate: { gte: since } } }),
    prisma.attendanceRecord.count({
      where: { workDate: { gte: since }, status: "LATE" },
    }),
    prisma.projectTask.count({ where: { status: "DONE", updatedAt: { gte: since } } }),
    prisma.projectTask.count({ where: { status: { not: "DONE" } } }),
    prisma.financeEntry.aggregate({
      where: { type: "INCOME", entryDate: { gte: since } },
      _sum: { amountCents: true },
    }),
    prisma.financeEntry.aggregate({
      where: { type: "EXPENSE", entryDate: { gte: since } },
      _sum: { amountCents: true },
    }),
    prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
  ]);

  const closed = wonLeads + lostLeads;
  const conversionRate = closed > 0 ? Math.round((wonLeads / closed) * 1000) / 10 : 0;
  const avgDealCents = Math.round(leadValue._avg.valueCents || 0);
  const resolutionRate =
    openTickets + resolvedTickets > 0
      ? Math.round((resolvedTickets / (openTickets + resolvedTickets)) * 1000) / 10
      : 0;
  const onTimeAttendance =
    attendance > 0 ? Math.round(((attendance - lateAttendance) / attendance) * 1000) / 10 : 100;
  const productivity =
    tasksDone + tasksOpen > 0
      ? Math.round((tasksDone / (tasksDone + tasksOpen)) * 1000) / 10
      : 0;

  const rev = revenue._sum.amountCents || 0;
  const exp = expenses._sum.amountCents || 0;

  // Simple linear trend stub for forecasting (last period vs prior)
  const priorSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);
  const priorWon = await prisma.crmLead.count({
    where: { stage: "WON", updatedAt: { gte: priorSince, lt: since } },
  });
  const forecastWon = Math.max(0, Math.round(wonLeads + (wonLeads - priorWon) * 0.5));

  const heatmap = await buildDeptHeatmap(since);

  return {
    days,
    sales: {
      wonLeads,
      lostLeads,
      conversionRate,
      avgDealCents,
      revenueCents: leadValue._sum.valueCents || 0,
      forecastWon,
    },
    customerService: {
      openTickets,
      resolvedTickets,
      resolutionRate,
      avgCsat: csat._avg.rating ? Math.round(csat._avg.rating * 10) / 10 : null,
      csatCount: csat._count._all,
    },
    operations: {
      attendanceDays: attendance,
      lateDays: lateAttendance,
      onTimeAttendancePct: onTimeAttendance,
      qualityScore: csat._avg.rating ? Math.round(csat._avg.rating * 20) : null,
    },
    productivity: {
      tasksDone,
      tasksOpen,
      completionPct: productivity,
    },
    financial: {
      revenueCents: rev,
      expenseCents: exp,
      profitCents: rev - exp,
    },
    compliance: { auditEvents: audits },
    heatmap,
  };
}

async function buildDeptHeatmap(since: Date) {
  const depts = await prisma.department.findMany({ take: 20 });
  const rows = [];
  for (const d of depts) {
    const employees = await prisma.employee.count({ where: { departmentId: d.id } });
    const leads = await prisma.crmLead.count({
      where: { departmentId: d.id, updatedAt: { gte: since } },
    });
    rows.push({
      department: d.name,
      code: d.code,
      employees,
      leads,
      intensity: Math.min(100, employees * 10 + leads * 5),
    });
  }
  return rows;
}

export async function evaluatePerformanceAlerts() {
  const alerts = await prisma.performanceAlert.findMany({ where: { active: true }, take: 50 });
  const fired: string[] = [];
  const snap = await buildPerformanceSnapshot(30);

  for (const a of alerts) {
    let value: number | null = null;
    if (a.metricKey === "CONVERSION") value = snap.sales.conversionRate;
    else if (a.metricKey === "CSAT") value = snap.customerService.avgCsat;
    else if (a.metricKey === "ATTENDANCE") value = snap.operations.onTimeAttendancePct;
    else if (a.metricKey === "PRODUCTIVITY") value = snap.productivity.completionPct;
    else if (a.metricKey === "RESOLUTION") value = snap.customerService.resolutionRate;

    if (value == null) continue;
    const breach =
      a.direction === "BELOW" ? value < a.threshold : value > a.threshold;
    if (!breach) continue;

    await prisma.performanceAlert.update({
      where: { id: a.id },
      data: { lastFiredAt: new Date() },
    });
    if (a.userId) {
      const { notifyUser } = await import("@/lib/support/notify");
      await notifyUser({
        userId: a.userId,
        title: `Underperformance alert · ${a.metricKey}`,
        body: `${a.metricKey} is ${value} (threshold ${a.direction} ${a.threshold}).`,
        category: "SYSTEM",
        href: "/staff/performance",
      });
    }
    fired.push(a.id);
  }
  return { fired: fired.length, alertIds: fired };
}

export type ReportKind =
  | "sales"
  | "kpi"
  | "attendance"
  | "customer"
  | "financial"
  | "compliance";

export async function buildReport(kind: ReportKind, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  if (kind === "sales") {
    const byOwner = await prisma.crmLead.groupBy({
      by: ["ownerId"],
      where: { stage: "WON", updatedAt: { gte: since } },
      _count: { _all: true },
      _sum: { valueCents: true },
    });
    return { kind, rows: byOwner };
  }
  if (kind === "kpi") {
    const targets = await prisma.kpiTarget.findMany({ take: 100, orderBy: { createdAt: "desc" } });
    const entries = await prisma.kpiEntry.findMany({
      where: { recordedAt: { gte: since } },
      take: 200,
    });
    return { kind, targets, entries };
  }
  if (kind === "attendance") {
    const byStatus = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { workDate: { gte: since } },
      _count: { _all: true },
    });
    return { kind, byStatus };
  }
  if (kind === "customer") {
    const profiles = await prisma.customerProfile.findMany({
      take: 50,
      orderBy: { updatedAt: "desc" },
      select: {
        customerCode: true,
        customerRating: true,
        user: { select: { fullName: true, email: true } },
      },
    });
    return {
      kind,
      rows: profiles.map((p) => ({
        name: p.user.fullName,
        email: p.user.email,
        code: p.customerCode,
        rating: p.customerRating,
        churnRisk: p.customerRating === "AT_RISK" ? "HIGH" : p.customerRating === "AVERAGE" ? "MED" : "LOW",
      })),
    };
  }
  if (kind === "financial") {
    const byType = await prisma.financeEntry.groupBy({
      by: ["type"],
      where: { entryDate: { gte: since } },
      _sum: { amountCents: true },
    });
    return { kind, byType };
  }
  const logs = await prisma.auditLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { kind, logs };
}
