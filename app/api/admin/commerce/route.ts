import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const [orders, invoices, revenuePaid, customerCount] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: { select: { email: true, fullName: true } },
          invoice: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.invoice.findMany({
        include: {
          user: { select: { email: true, fullName: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.payment.aggregate({
        where: { status: "SUCCEEDED" },
        _sum: { amountCents: true },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
    ]);

    return NextResponse.json({
      orders,
      invoices,
      stats: {
        revenueCents: revenuePaid._sum.amountCents ?? 0,
        orderCount: orders.length,
        openInvoices: invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID").length,
        customerCount,
      },
    });
  } catch (error) {
    console.error("[admin:commerce]", error);
    return NextResponse.json({ error: "Failed to load admin commerce" }, { status: 500 });
  }
}
