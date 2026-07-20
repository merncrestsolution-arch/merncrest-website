import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { notifyUser } from "@/lib/support/notify";
import { z } from "zod";

/** Multi-level approval workflow hub */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const [mine, pending, recent] = await Promise.all([
    prisma.approvalRequest.findMany({
      where: { requesterId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.approvalRequest.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    mine,
    pending,
    recent,
    stats: {
      pending: pending.length,
      mineOpen: mine.filter((m) => m.status === "PENDING").length,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    type: z.enum([
      "LEAVE",
      "PURCHASE",
      "EXPENSE",
      "QUOTATION",
      "PROJECT",
      "INVOICE",
      "DOCUMENT",
      "CUSTOM",
    ]),
    title: z.string().min(2),
    description: z.string().optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    amountCents: z.number().int().optional(),
    approverId: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid approval request" }, { status: 400 });
  }

  const requestRow = await prisma.approvalRequest.create({
    data: {
      requestNumber: nextNumber("APR"),
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      status: "PENDING",
      requesterId: auth.user.id,
      approverId: parsed.data.approverId,
      referenceType: parsed.data.referenceType,
      referenceId: parsed.data.referenceId,
      amountCents: parsed.data.amountCents,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "APPROVALS",
    entityType: "ApprovalRequest",
    entityId: requestRow.id,
    summary: `Approval requested: ${requestRow.title}`,
  });

  if (parsed.data.approverId) {
    void notifyUser({
      userId: parsed.data.approverId,
      title: `Approval needed · ${requestRow.requestNumber}`,
      body: requestRow.title,
      category: "SYSTEM",
      href: "/admin/erp/approvals",
    });
  }

  return NextResponse.json({ request: requestRow }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission([
    "erp.hr.manage",
    "erp.finance.manage",
    "erp.procurement.manage",
    "erp.permissions.manage",
  ]);
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    id: z.string(),
    action: z.enum(["approve", "reject"]),
    decisionNote: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const existing = await prisma.approvalRequest.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Already decided" }, { status: 400 });
  }

  const status = parsed.data.action === "approve" ? "APPROVED" : "REJECTED";
  const updated = await prisma.approvalRequest.update({
    where: { id: existing.id },
    data: {
      status,
      approverId: auth.user.id,
      decidedAt: new Date(),
      decisionNote: parsed.data.decisionNote,
    },
  });

  // Sync linked leave when type is LEAVE
  if (existing.type === "LEAVE" && existing.referenceId) {
    await prisma.leaveRequest.updateMany({
      where: { id: existing.referenceId },
      data: {
        status: status === "APPROVED" ? "APPROVED" : "REJECTED",
        approverId: auth.user.id,
      },
    });
  }

  // Sync purchase orders
  if (existing.type === "PURCHASE" && existing.referenceId) {
    await prisma.purchaseOrder.updateMany({
      where: { id: existing.referenceId },
      data: { status: status === "APPROVED" ? "APPROVED" : "CANCELLED" },
    });
  }

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: status === "APPROVED" ? "APPROVE" : "REJECT",
    module: "APPROVALS",
    entityType: "ApprovalRequest",
    entityId: updated.id,
    summary: `${status}: ${updated.title}`,
  });

  void notifyUser({
    userId: existing.requesterId,
    title: `Request ${status.toLowerCase()} · ${updated.requestNumber}`,
    body: updated.title,
    category: "SYSTEM",
    href: "/staff",
  });

  return NextResponse.json({ request: updated });
}
