import { prisma } from "@/lib/db";
import { getSettingBool, getMaintenanceMessage } from "@/lib/admin/settings";

export type CommandCenterKpis = {
  todayRevenueCents: number;
  monthRevenueCents: number;
  pendingPayments: number;
  newLeads: number;
  newClients: number;
  activeProjects: number;
  openTickets: number;
  liveChats: number;
  domainExpiryAlerts: number;
  sslExpiryAlerts: number;
  hostingExpiryAlerts: number;
  serverHealth: "healthy" | "degraded" | "maintenance";
  serverStatus: "online" | "degraded";
  staffAttendanceToday: number;
  dailyTasks: number;
  newOrders: number;
};

export type CommandCenterAlert = {
  id: string;
  type: "domain" | "hosting" | "ssl";
  label: string;
  date: string | null;
  severity: "warning" | "critical";
};

export type CommandCenterActivity = {
  id: string;
  action: string;
  module: string;
  summary: string;
  actorName: string | null;
  createdAt: string;
};

export type CommandCenterCalendarItem = {
  id: string;
  title: string;
  startsAt: string;
  kind: string;
  location?: string | null;
};

export type CommandCenterPayload = {
  kpis: CommandCenterKpis;
  alerts: CommandCenterAlert[];
  recentActivities: CommandCenterActivity[];
  upcomingCalendar: CommandCenterCalendarItem[];
  quickActions: { label: string; href: string; icon?: string }[];
};

const EXPIRY_DAYS = 30;

export async function getCommandCenterData(userId: string): Promise<CommandCenterPayload> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
  const expiryCutoff = new Date(startOfDay.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const sslBadStatuses = ["PENDING", "EXPIRED", "FAILED", "NONE", "MISSING"];

  const [
    todayRevenue,
    monthRevenue,
    newCustomers,
    newOrders,
    pendingPayments,
    openTickets,
    newLeads,
    activeProjects,
    attendanceToday,
    liveChats,
    domainExpiryCount,
    hostingExpiryCount,
    sslAlertCount,
    dailyTasks,
    expiringDomains,
    expiringHosting,
    sslHosting,
    recentAudit,
    upcomingEvents,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: startOfDay } },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: startOfMonth } },
      _sum: { amountCents: true },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: startOfDay } },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.payment.count({
      where: { status: { in: ["PENDING", "AWAITING_VERIFICATION"] } },
    }),
    prisma.ticket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } },
    }),
    prisma.crmLead.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.erpProject.count({
      where: { status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] } },
    }),
    prisma.attendanceRecord.count({
      where: { workDate: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.chatSession.count({
      where: { status: { in: ["OPEN", "HANDOFF", "PENDING"] } },
    }),
    prisma.domain.count({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: expiryCutoff, gte: startOfDay },
      },
    }),
    prisma.hostingAccount.count({
      where: {
        status: "ACTIVE",
        renewsAt: { lte: expiryCutoff, gte: startOfDay },
      },
    }),
    prisma.hostingAccount.count({
      where: {
        status: "ACTIVE",
        sslStatus: { in: sslBadStatuses },
      },
    }),
    prisma.projectTask.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.domain.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: expiryCutoff, gte: startOfDay },
      },
      orderBy: { expiresAt: "asc" },
      take: 8,
      select: { id: true, name: true, tld: true, expiresAt: true },
    }),
    prisma.hostingAccount.findMany({
      where: {
        status: "ACTIVE",
        renewsAt: { lte: expiryCutoff, gte: startOfDay },
      },
      orderBy: { renewsAt: "asc" },
      take: 8,
      select: { id: true, label: true, renewsAt: true },
    }),
    prisma.hostingAccount.findMany({
      where: {
        status: "ACTIVE",
        sslStatus: { in: sslBadStatuses },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, label: true, sslStatus: true, primaryDomain: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        action: true,
        module: true,
        summary: true,
        actorName: true,
        createdAt: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: {
        startsAt: { gte: startOfDay },
        OR: [
          { ownerId: userId },
          { shared: true },
          { attendeesJson: { contains: userId } },
        ],
      },
      orderBy: { startsAt: "asc" },
      take: 6,
      select: {
        id: true,
        title: true,
        startsAt: true,
        kind: true,
        location: true,
      },
    }),
  ]);

  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  const maintenance = await getSettingBool("maintenance.enabled", false);

  const alerts: CommandCenterAlert[] = [
    ...expiringDomains.map((d) => ({
      id: d.id,
      type: "domain" as const,
      label: `${d.name}.${d.tld}`,
      date: d.expiresAt?.toISOString() ?? null,
      severity:
        d.expiresAt && d.expiresAt.getTime() - startOfDay.getTime() < 7 * 86400000
          ? ("critical" as const)
          : ("warning" as const),
    })),
    ...expiringHosting.map((h) => ({
      id: h.id,
      type: "hosting" as const,
      label: h.label,
      date: h.renewsAt?.toISOString() ?? null,
      severity:
        h.renewsAt && h.renewsAt.getTime() - startOfDay.getTime() < 7 * 86400000
          ? ("critical" as const)
          : ("warning" as const),
    })),
    ...sslHosting.map((h) => ({
      id: h.id,
      type: "ssl" as const,
      label: h.primaryDomain || h.label,
      date: null,
      severity: h.sslStatus === "EXPIRED" || h.sslStatus === "FAILED" ? ("critical" as const) : ("warning" as const),
    })),
  ].slice(0, 12);

  return {
    kpis: {
      todayRevenueCents: todayRevenue._sum.amountCents ?? 0,
      monthRevenueCents: monthRevenue._sum.amountCents ?? 0,
      pendingPayments,
      newLeads,
      newClients: newCustomers,
      activeProjects,
      openTickets,
      liveChats,
      domainExpiryAlerts: domainExpiryCount,
      sslExpiryAlerts: sslAlertCount,
      hostingExpiryAlerts: hostingExpiryCount,
      serverHealth: maintenance ? "maintenance" : dbOk ? "healthy" : "degraded",
      serverStatus: dbOk ? "online" : "degraded",
      staffAttendanceToday: attendanceToday,
      dailyTasks,
      newOrders,
    },
    alerts,
    recentActivities: recentAudit.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    upcomingCalendar: upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      kind: e.kind,
      location: e.location,
    })),
    quickActions: [
      { label: "Billing hub", href: "/staff/billing", icon: "payments" },
      { label: "New quotation", href: "/staff/quotations", icon: "quote" },
      { label: "Create client", href: "/staff/clients", icon: "client" },
      { label: "Verify payments", href: "/admin/payments", icon: "payments" },
      { label: "CRM pipeline", href: "/admin/crm", icon: "crm" },
      { label: "Live chat", href: "/staff/live-chat", icon: "chat" },
      { label: "AWS cloud", href: "/staff/cloud", icon: "cloud" },
      { label: "Monitoring", href: "/staff/monitoring", icon: "monitor" },
      { label: "Support queue", href: "/staff/tickets", icon: "tickets" },
      { label: "Projects", href: "/admin/erp/projects", icon: "erp" },
    ],
  };
}
