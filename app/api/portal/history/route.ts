import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { computeProjectFinance } from "@/lib/erp/projects/finance";

/**
 * Client payment history + project history (portal).
 * Payments: all statuses. Projects: member or customer-linked, with due dates (no internal costs).
 */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "all";

  const [payments, invoices, orders, projects, activities] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: auth.user.id },
      include: {
        order: { select: { orderNumber: true, status: true } },
        invoice: { select: { invoiceNumber: true, status: true, dueAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.invoice.findMany({
      where: { userId: auth.user.id },
      include: { order: { select: { orderNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.order.findMany({
      where: { userId: auth.user.id },
      include: { items: true, invoice: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.erpProject.findMany({
      where: {
        OR: [
          { customerId: auth.user.id },
          { members: { some: { userId: auth.user.id } } },
        ],
      },
      include: {
        milestones: { orderBy: { dueDate: "asc" } },
        payments: { orderBy: { dueDate: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.customerActivity.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const projectHistory = projects.map((p) => {
    const finance = computeProjectFinance({
      budgetCents: 0,
      spentCents: 0,
      revenueCents: 0,
      payments: p.payments,
      nextPaymentAt: p.nextPaymentAt,
      nextPaymentCents: p.nextPaymentCents,
    });
    return {
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      nextPaymentAt: finance.nextPaymentAt,
      nextPaymentCents: finance.nextPaymentCents,
      overdueCount: finance.overdueCount,
      milestones: p.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        dueDate: m.dueDate,
      })),
      schedule: p.payments.map((pay) => ({
        id: pay.id,
        label: pay.label,
        amountCents: pay.amountCents,
        dueDate: pay.dueDate,
        status: pay.status,
        paidAt: pay.paidAt,
      })),
    };
  });

  if (view === "payments") {
    return NextResponse.json({ payments, invoices });
  }
  if (view === "projects") {
    return NextResponse.json({ projects: projectHistory });
  }

  return NextResponse.json({
    payments,
    invoices,
    orders,
    projects: projectHistory,
    activities,
  });
}
