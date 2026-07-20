import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requireStaff } from "@/lib/commerce";
import { z } from "zod";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const refunds = await prisma.refundRequest.findMany({
    where: auth.user.role === "CUSTOMER" ? { userId: auth.user.id } : undefined,
    include: { order: { select: { orderNumber: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ refunds });
}

const createSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(5).max(1000),
  amountCents: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, userId: auth.user.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (
      !["COMPLETED", "PAID", "PROCESSING", "PROVISIONING", "PROVISIONING_FAILED"].includes(
        order.status
      )
    ) {
      return NextResponse.json({ error: "Order not eligible for refund" }, { status: 400 });
    }

    const refund = await prisma.refundRequest.create({
      data: {
        userId: auth.user.id,
        orderId: order.id,
        amountCents: parsed.data.amountCents ?? order.totalCents,
        reason: parsed.data.reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) {
    console.error("[refunds:post]", error);
    return NextResponse.json({ error: "Failed to create refund request" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  refundId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED", "PAID"]),
  adminNote: z.string().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const refund = await prisma.refundRequest.update({
      where: { id: parsed.data.refundId },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote,
      },
    });

    return NextResponse.json({ refund });
  } catch (error) {
    console.error("[refunds:patch]", error);
    return NextResponse.json({ error: "Failed to update refund" }, { status: 500 });
  }
}
