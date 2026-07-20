import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffOrAdmin } from "@/lib/admin/require-admin";
import { getSettingBool, getMaintenanceMessage } from "@/lib/admin/settings";

/** Expanded admin command-center dashboard widgets */
export async function GET() {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [
    todayRevenue,
    monthRevenue,
    newCustomers,
    newOrders,
    pendingPayments,
    pendingTickets,
    newLeads,
    projects,
    attendanceToday,
    recentAudit,
    notifications,
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
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.crmLead.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.erpProject.count({ where: { status: { in: ["PLANNING", "ACTIVE"] } } }),
    prisma.attendanceRecord.count({
      where: { date: { gte: startOfDay } },
    }).catch(() => 0),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        module: true,
        summary: true,
        actorName: true,
        createdAt: true,
      },
    }),
    prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  const maintenance = await getSettingBool("maintenance.enabled", false);

  return NextResponse.json({
    widgets: {
      todayRevenueCents: todayRevenue._sum.amountCents ?? 0,
      monthRevenueCents: monthRevenue._sum.amountCents ?? 0,
      newCustomers,
      newOrders,
      pendingPayments,
      pendingTickets,
      newLeads,
      projects,
      attendanceToday,
      serverStatus: dbOk ? "online" : "degraded",
      systemHealth: maintenance ? "maintenance" : dbOk ? "healthy" : "degraded",
      maintenance,
      maintenanceMessage: maintenance ? await getMaintenanceMessage() : null,
    },
    recentActivities: recentAudit,
    notifications,
    quickActions: [
      { label: "Verify payments", href: "/admin/payments" },
      { label: "CRM pipeline", href: "/admin/crm" },
      { label: "Support queue", href: "/admin/support" },
      { label: "Providers", href: "/admin/providers" },
      { label: "Users", href: "/admin/users" },
      { label: "System settings", href: "/admin/settings" },
      { label: "Monitoring", href: "/admin/monitoring" },
      { label: "ERP hub", href: "/admin/erp" },
    ],
  });
}
