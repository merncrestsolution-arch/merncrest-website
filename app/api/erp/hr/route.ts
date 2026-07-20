import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.hr.view", "erp.hr.manage"]);
  if (auth.error) return auth.error;

  const [employees, departments, leave] = await Promise.all([
    prisma.employee.findMany({
      include: { department: true, user: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.leaveRequest.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        approver: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({ employees, departments, leave });
}

const empSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().min(2),
  departmentId: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional(),
  salaryCents: z.number().int().min(0).optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.hr.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = empSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: {
      employeeCode: nextNumber("EMP"),
      ...parsed.data,
      employmentType: parsed.data.employmentType ?? "FULL_TIME",
    },
    include: { department: true },
  });
  return NextResponse.json({ employee }, { status: 201 });
}

const leaveSchema = z.object({
  leaveType: z.enum(["ANNUAL", "SICK", "UNPAID", "OTHER"]).optional(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

const leaveActionSchema = z.object({
  leaveId: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
});

export async function PUT(request: Request) {
  const auth = await requirePermission(["erp.hr.view", "erp.hr.manage"]);
  if (auth.error) return auth.error;

  const body = await request.json();

  // Staff requesting leave for themselves
  if (body.startDate && !body.leaveId) {
    const parsed = leaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid leave" }, { status: 400 });
    }
    const leave = await prisma.leaveRequest.create({
      data: {
        userId: auth.user.id,
        leaveType: parsed.data.leaveType ?? "ANNUAL",
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        reason: parsed.data.reason,
        status: "PENDING",
      },
    });

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
    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "HR",
      entityType: "LeaveRequest",
      entityId: leave.id,
      summary: `Leave requested: ${leave.leaveType}`,
    });

    return NextResponse.json({ leave, approval }, { status: 201 });
  }

  // Approve / reject
  const action = leaveActionSchema.safeParse(body);
  if (!action.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const manage = await requirePermission("erp.hr.manage");
  if (manage.error) return manage.error;

  const leave = await prisma.leaveRequest.update({
    where: { id: action.data.leaveId },
    data: {
      status: action.data.status,
      approverId: auth.user.id,
    },
  });

  await prisma.approvalRequest.updateMany({
    where: {
      referenceType: "LeaveRequest",
      referenceId: leave.id,
      status: "PENDING",
    },
    data: {
      status: action.data.status === "APPROVED" ? "APPROVED" : action.data.status === "REJECTED" ? "REJECTED" : "CANCELLED",
      approverId: auth.user.id,
      decidedAt: new Date(),
    },
  });
  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: action.data.status === "APPROVED" ? "APPROVE" : "REJECT",
    module: "HR",
    entityType: "LeaveRequest",
    entityId: leave.id,
    summary: `Leave ${action.data.status.toLowerCase()}: ${leave.leaveType}`,
  });

  return NextResponse.json({ leave });
}
