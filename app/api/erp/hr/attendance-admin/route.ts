import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission, requirePermissionWithScope } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { SYSTEM_LEAVE_TYPES } from "@/lib/erp/roles-hierarchy";

export async function GET() {
  const auth = await requirePermissionWithScope(["erp.hr.view", "erp.hr.manage"]);
  if (auth.error) return auth.error;

  const year = new Date().getFullYear();
  const [holidays, leaveTypes, shifts, overtime] = await Promise.all([
    prisma.holidayCalendar.findMany({
      where: { date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      orderBy: { date: "asc" },
    }),
    prisma.leaveTypeConfig.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.workShift.findMany({ orderBy: { name: "asc" } }),
    prisma.overtimeRequest.findMany({
      where:
        auth.scope && !auth.scope.isFullAccess && auth.scope.visibleUserIds
          ? { userId: { in: auth.scope.visibleUserIds } }
          : undefined,
      include: {
        user: { select: { fullName: true, email: true } },
        approver: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return NextResponse.json({
    holidays,
    leaveTypes: leaveTypes.length
      ? leaveTypes
      : SYSTEM_LEAVE_TYPES.map((t, i) => ({
          id: t.code,
          code: t.code,
          name: t.label,
          paid: t.code !== "UNPAID",
          maxDays: null,
          active: true,
          sortOrder: i,
        })),
    shifts,
    overtime,
  });
}

const holidaySchema = z.object({
  name: z.string().min(2),
  date: z.string(),
  region: z.string().optional(),
});

const shiftSchema = z.object({
  name: z.string().min(2),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  departmentId: z.string().optional(),
});

const leaveTypeSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(2),
  paid: z.boolean().optional(),
  maxDays: z.number().optional(),
});

const otActionSchema = z.object({
  overtimeId: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.hr.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const kind = body.kind as string;

  if (kind === "HOLIDAY") {
    const parsed = holidaySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid holiday" }, { status: 400 });
    const holiday = await prisma.holidayCalendar.create({
      data: {
        name: parsed.data.name,
        date: new Date(parsed.data.date),
        region: parsed.data.region || "LK",
      },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "HR",
      entityType: "HolidayCalendar",
      entityId: holiday.id,
      summary: `Holiday: ${holiday.name}`,
    });
    return NextResponse.json({ holiday }, { status: 201 });
  }

  if (kind === "SHIFT") {
    const parsed = shiftSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid shift" }, { status: 400 });
    const shift = await prisma.workShift.create({
      data: {
        name: parsed.data.name,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        departmentId: parsed.data.departmentId,
      },
    });
    return NextResponse.json({ shift }, { status: 201 });
  }

  if (kind === "LEAVE_TYPE") {
    const parsed = leaveTypeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
    const leaveType = await prisma.leaveTypeConfig.upsert({
      where: { code: parsed.data.code.toUpperCase() },
      create: {
        code: parsed.data.code.toUpperCase(),
        name: parsed.data.name,
        paid: parsed.data.paid ?? true,
        maxDays: parsed.data.maxDays,
        sortOrder: 200,
      },
      update: {
        name: parsed.data.name,
        paid: parsed.data.paid,
        maxDays: parsed.data.maxDays,
        active: true,
      },
    });
    return NextResponse.json({ leaveType }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}

export async function PUT(request: Request) {
  const auth = await requirePermission("erp.hr.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = otActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const ot = await prisma.overtimeRequest.update({
    where: { id: parsed.data.overtimeId },
    data: { status: parsed.data.status, approverId: auth.user.id },
  });

  if (parsed.data.status === "APPROVED") {
    const employee = await prisma.employee.findFirst({ where: { userId: ot.userId } });
    if (employee) {
      const dayStart = new Date(ot.workDate);
      dayStart.setHours(0, 0, 0, 0);
      const existing = await prisma.attendanceRecord.findFirst({
        where: { employeeId: employee.id, workDate: dayStart },
      });
      if (existing) {
        await prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: { overtimeMinutes: Math.round(ot.hours * 60) },
        });
      }
    }
  }

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: parsed.data.status === "APPROVED" ? "APPROVE" : "REJECT",
    module: "HR",
    entityType: "OvertimeRequest",
    entityId: ot.id,
    summary: `Overtime ${parsed.data.status.toLowerCase()}`,
  });

  return NextResponse.json({ overtime: ot });
}
