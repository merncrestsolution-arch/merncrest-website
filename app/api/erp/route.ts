import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserPermissions, requireErpStaff } from "@/lib/erp/permissions";

export async function GET() {
  const auth = await requireErpStaff();
  if (auth.error) return auth.error;

  try {
    const perms = await getUserPermissions(auth.user);
    const [
      employees,
      leavePending,
      projects,
      assets,
      inventoryItems,
      workOrders,
      income,
      expense,
    ] = await Promise.all([
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.erpProject.count({ where: { status: { in: ["PLANNING", "ACTIVE"] } } }),
      prisma.asset.count({ where: { status: { not: "RETIRED" } } }),
      prisma.inventoryItem.findMany({ take: 100 }),
      prisma.workOrder.count({ where: { status: { in: ["OPEN", "SCHEDULED", "IN_PROGRESS"] } } }),
      prisma.financeEntry.aggregate({
        where: { type: "INCOME" },
        _sum: { amountCents: true },
      }),
      prisma.financeEntry.aggregate({
        where: { type: "EXPENSE" },
        _sum: { amountCents: true },
      }),
    ]);

    const lowStock = inventoryItems.filter((i) => i.quantity <= i.reorderLevel).slice(0, 5);

    return NextResponse.json({
      permissions: Array.from(perms),
      stats: {
        employees,
        leavePending,
        projects,
        assets,
        inventory: inventoryItems.length,
        workOrders,
        incomeCents: income._sum.amountCents ?? 0,
        expenseCents: expense._sum.amountCents ?? 0,
        netCents: (income._sum.amountCents ?? 0) - (expense._sum.amountCents ?? 0),
        lowStockCount: lowStock.length,
      },
      lowStock,
    });
  } catch (error) {
    console.error("[erp:dashboard]", error);
    return NextResponse.json({ error: "Failed to load ERP dashboard" }, { status: 500 });
  }
}
