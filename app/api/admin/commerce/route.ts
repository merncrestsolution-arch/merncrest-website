import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { activateOrderServices } from "@/lib/services/fulfillment";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const [orders, invoices, revenuePaid, customerCount, domainCount, hostingCount] =
      await Promise.all([
        prisma.order.findMany({
          where: status ? { status } : undefined,
          include: {
            user: { select: { email: true, fullName: true } },
            invoice: true,
            items: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
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
        prisma.domain.count(),
        prisma.hostingAccount.count(),
      ]);

    const failedCount = await prisma.order.count({
      where: { status: "PROVISIONING_FAILED" },
    });

    return NextResponse.json({
      orders,
      invoices,
      stats: {
        revenueCents: revenuePaid._sum.amountCents ?? 0,
        orderCount: orders.length,
        openInvoices: invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID")
          .length,
        customerCount,
        domainCount,
        hostingCount,
        provisioningFailedCount: failedCount,
      },
      filter: status || null,
    });
  } catch (error) {
    console.error("[admin:commerce]", error);
    return NextResponse.json({ error: "Failed to load admin commerce" }, { status: 500 });
  }
}

const provisionSchema = z.object({
  orderId: z.string().min(1),
  action: z.literal("reprovision"),
});

/** Manual reprovision fallback for PROVISIONING_FAILED (or stuck) orders */
export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = provisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowed = ["PAID", "PROCESSING", "PROVISIONING", "PROVISIONING_FAILED", "COMPLETED"];
  if (!allowed.includes(order.status)) {
    return NextResponse.json(
      { error: `Cannot reprovision order in status ${order.status}` },
      { status: 400 }
    );
  }

  const result = await activateOrderServices(order.id, undefined, {
    actorId: auth.user.id,
    manual: true,
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "order.reprovision",
    module: "marketplace",
    entityType: "Order",
    entityId: order.id,
    summary: `Manual reprovision → ${result.status}`,
    meta: { orderNumber: order.orderNumber, result },
  });

  return NextResponse.json({
    message: `Reprovision finished: ${result.status}`,
    result,
  });
}
