import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";

import { SYSTEM_LEAVE_TYPES } from "@/lib/erp/roles-hierarchy";

const LEAVE_TYPES = [
  "ANNUAL",
  "CASUAL",
  "SICK",
  "UNPAID",
  "MATERNITY",
  "PATERNITY",
  "STUDY",
  "OTHER",
] as const;

function dayCount(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)) + 1);
}

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const year = new Date().getFullYear();
  const [balances, requests] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { userId: auth.user.id, year },
      orderBy: { leaveType: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  // Ensure default balances exist
  if (balances.length === 0) {
    const employee = await prisma.employee.findFirst({ where: { userId: auth.user.id } });
    const defaults = [
      { leaveType: "ANNUAL", entitled: 14 },
      { leaveType: "CASUAL", entitled: 7 },
      { leaveType: "SICK", entitled: 7 },
    ];
    await prisma.leaveBalance.createMany({
      data: defaults.map((d) => ({
        userId: auth.user.id,
        employeeId: employee?.id,
        leaveType: d.leaveType,
        year,
        entitled: d.entitled,
        used: 0,
        pending: 0,
      })),
    });
    const refreshed = await prisma.leaveBalance.findMany({
      where: { userId: auth.user.id, year },
    });
    return NextResponse.json({
      balances: refreshed,
      requests,
      leaveTypes: SYSTEM_LEAVE_TYPES,
    });
  }

  return NextResponse.json({
    balances,
    requests,
    leaveTypes: SYSTEM_LEAVE_TYPES,
  });
}

const createSchema = z.object({
  leaveType: z.enum(LEAVE_TYPES),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid leave request" }, { status: 400 });
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  const days = dayCount(start, end);
  const year = start.getFullYear();

  const balance = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveType_year: {
        userId: auth.user.id,
        leaveType: parsed.data.leaveType,
        year,
      },
    },
  });

  if (
    balance &&
    parsed.data.leaveType !== "UNPAID" &&
    balance.used + balance.pending + days > balance.entitled
  ) {
    return NextResponse.json(
      { error: `Insufficient ${parsed.data.leaveType} balance` },
      { status: 400 }
    );
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: auth.user.id,
      leaveType: parsed.data.leaveType,
      startDate: start,
      endDate: end,
      days,
      reason: parsed.data.reason,
      status: "PENDING",
    },
  });

  if (balance) {
    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { pending: { increment: days } },
    });
  }

  const approval = await prisma.approvalRequest.create({
    data: {
      requestNumber: nextNumber("APR"),
      type: "LEAVE",
      title: `${leave.leaveType} leave · ${auth.user.fullName}`,
      description: leave.reason || undefined,
      status: "PENDING",
      requesterId: auth.user.id,
      referenceType: "LeaveRequest",
      referenceId: leave.id,
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "HR",
    entityType: "LeaveRequest",
    entityId: leave.id,
    summary: `Leave requested: ${leave.leaveType} (${days}d)`,
  });

  return NextResponse.json({ leave, approval }, { status: 201 });
}
