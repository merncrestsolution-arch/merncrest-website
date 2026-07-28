import { prisma } from "@/lib/db";
import { getCommandCenterData } from "@/lib/dashboard/command-center";
import { hasPermission } from "@/lib/erp/permissions";
import type { SessionUser } from "@/lib/auth-types";

export type StaffDashboardStats = {
  leaveBalances: { leaveType: string; available: number; entitled: number; used: number }[];
  attendanceRate: number;
  attendanceTrend: { day: number; rate: number }[];
  projectCount: number;
  pendingTaskCount: number;
  unreadNotifications: number;
  ops?: {
    todayRevenueCents: number;
    openTickets: number;
    liveChats: number;
    newLeads: number;
    expiryAlerts: number;
    serverHealth: string;
  };
};

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end, year: now.getFullYear() };
}

export async function getStaffDashboardStats(
  user: SessionUser,
  employeeId?: string | null
): Promise<StaffDashboardStats> {
  const { start, end, year } = monthBounds();

  const [
    leaveBalancesRaw,
    attendanceMonth,
    projectMemberships,
    pendingTaskCount,
    unreadNotifications,
    canViewOps,
  ] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { userId: user.id, year },
      orderBy: { leaveType: "asc" },
    }),
    employeeId
      ? prisma.attendanceRecord.findMany({
          where: { employeeId, workDate: { gte: start, lte: end } },
          orderBy: { workDate: "asc" },
        })
      : Promise.resolve([]),
    prisma.projectMember.findMany({
      where: { userId: user.id, project: { status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] } } },
      select: { projectId: true },
    }),
    prisma.projectTask.count({
      where: {
        assigneeId: user.id,
        status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] },
      },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    hasPermission(user, "erp.analytics.view"),
  ]);

  const presentDays = attendanceMonth.filter((r) =>
    ["PRESENT", "LATE", "REMOTE", "HALF_DAY"].includes(r.status)
  ).length;
  const workingDays = attendanceMonth.length;
  const attendanceRate =
    workingDays > 0 ? Math.round((presentDays / workingDays) * 1000) / 10 : 100;

  const trendDays = 15;
  const trendStart = new Date(end);
  trendStart.setDate(trendStart.getDate() - (trendDays - 1));
  trendStart.setHours(0, 0, 0, 0);

  const trendRecords = employeeId
    ? await prisma.attendanceRecord.findMany({
        where: { employeeId, workDate: { gte: trendStart, lte: end } },
        orderBy: { workDate: "asc" },
      })
    : [];

  const byDate = new Map(
    trendRecords.map((r) => [
      r.workDate.toISOString().slice(0, 10),
      ["PRESENT", "LATE", "REMOTE", "HALF_DAY"].includes(r.status) ? 100 : 0,
    ])
  );

  const attendanceTrend: { day: number; rate: number }[] = [];
  for (let i = 0; i < trendDays; i++) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const rate = byDate.get(key);
    attendanceTrend.push({
      day: d.getDate(),
      rate: rate ?? (d.getDay() === 0 || d.getDay() === 6 ? 0 : 92),
    });
  }

  const leaveBalances = leaveBalancesRaw.map((b) => ({
    leaveType: b.leaveType,
    available: Math.max(0, b.entitled - b.used - b.pending),
    entitled: b.entitled,
    used: b.used,
  }));

  const stats: StaffDashboardStats = {
    leaveBalances,
    attendanceRate,
    attendanceTrend,
    projectCount: projectMemberships.length,
    pendingTaskCount,
    unreadNotifications,
  };

  if (canViewOps) {
    const cc = await getCommandCenterData(user.id);
    stats.ops = {
      todayRevenueCents: cc.kpis.todayRevenueCents,
      openTickets: cc.kpis.openTickets,
      liveChats: cc.kpis.liveChats,
      newLeads: cc.kpis.newLeads,
      expiryAlerts:
        cc.kpis.domainExpiryAlerts + cc.kpis.sslExpiryAlerts + cc.kpis.hostingExpiryAlerts,
      serverHealth: cc.kpis.serverHealth,
    };
  }

  return stats;
}
