import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.fsm.view", "erp.fsm.manage"]);
  if (auth.error) return auth.error;

  const workOrders = await prisma.workOrder.findMany({
    include: { assignee: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ workOrders });
}

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assetCode: z.string().optional(),
  assigneeId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.fsm.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid work order" }, { status: 400 });
  }

  const workOrder = await prisma.workOrder.create({
    data: {
      workNumber: nextNumber("WO"),
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority ?? "MEDIUM",
      assetCode: parsed.data.assetCode,
      assigneeId: parsed.data.assigneeId,
      status: "OPEN",
    },
  });
  return NextResponse.json({ workOrder }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.fsm.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = z
    .object({
      id: z.string(),
      status: z.enum(["OPEN", "SCHEDULED", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
      assigneeId: z.string().nullable().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const workOrder = await prisma.workOrder.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      assigneeId: parsed.data.assigneeId === null ? null : parsed.data.assigneeId,
    },
  });
  return NextResponse.json({ workOrder });
}
