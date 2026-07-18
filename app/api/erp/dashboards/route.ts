import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireErpStaff } from "@/lib/erp/permissions";
import { getUserPermissions } from "@/lib/erp/permissions";

/** Executive dashboards (5.20) */
export async function GET() {
  const auth = await requireErpStaff();
  if (auth.error) return auth.error;

  const permissions = await getUserPermissions(auth.user);

  const [
    employees,
    leavePending,
    income,
    expense,
    projects,
    workOrders,
    incidents,
    devices,
    openTickets,
    customers,
    revenue,
    lowStockItems,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.financeEntry.aggregate({ where: { type: "INCOME" }, _sum: { amountCents: true } }),
    prisma.financeEntry.aggregate({ where: { type: "EXPENSE" }, _sum: { amountCents: true } }),
    prisma.erpProject.count({ where: { status: { in: ["ACTIVE", "PLANNING"] } } }),
    prisma.workOrder.count({ where: { status: { in: ["OPEN", "SCHEDULED", "IN_PROGRESS"] } } }),
    prisma.esIncident.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.iotDevice.findMany({ take: 20 }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amountCents: true },
    }),
    prisma.inventoryItem.findMany({ take: 100 }),
  ]);

  const lowStock = lowStockItems.filter((i) => i.quantity <= i.reorderLevel).length;
  const alertDevices = devices.filter((d) => d.status === "ALERT" || d.healthScore < 50).length;

  return NextResponse.json({
    permissions: Array.from(permissions),
    dashboards: {
      ceo: {
        customers,
        revenueCents: revenue._sum.amountCents ?? 0,
        netCents: (income._sum.amountCents ?? 0) - (expense._sum.amountCents ?? 0),
        projects,
        openTickets,
      },
      finance: {
        incomeCents: income._sum.amountCents ?? 0,
        expenseCents: expense._sum.amountCents ?? 0,
        netCents: (income._sum.amountCents ?? 0) - (expense._sum.amountCents ?? 0),
      },
      hr: { employees, leavePending },
      sales: { customers, revenueCents: revenue._sum.amountCents ?? 0, projects },
      support: { openTickets, incidents, workOrders },
      operations: { workOrders, lowStock, projects },
      projects: { active: projects },
      systemHealth: {
        iotDevices: devices.length,
        alertDevices,
        avgHealth:
          devices.length === 0
            ? 100
            : Math.round(devices.reduce((s, d) => s + d.healthScore, 0) / devices.length),
      },
    },
  });
}
