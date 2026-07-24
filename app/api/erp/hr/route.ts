import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission, requirePermissionWithScope } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { encryptPii } from "@/lib/security/pii";

export async function GET() {
  const auth = await requirePermissionWithScope(["erp.hr.view", "erp.hr.manage"]);
  if (auth.error) return auth.error;

  const where =
    auth.scope && !auth.scope.isFullAccess && auth.scope.departmentId
      ? { departmentId: auth.scope.departmentId }
      : auth.scope && !auth.scope.isFullAccess && auth.scope.visibleUserIds
        ? {
            OR: [
              { userId: { in: auth.scope.visibleUserIds } },
              ...(auth.scope.employeeId ? [{ id: auth.scope.employeeId }] : []),
            ],
          }
        : {};

  const leaveWhere =
    auth.scope && !auth.scope.isFullAccess && auth.scope.visibleUserIds
      ? { userId: { in: auth.scope.visibleUserIds } }
      : {};

  const [employees, departments, leave, branches, holidays, shifts, leaveTypes] =
    await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          branch: true,
          manager: { select: { id: true, fullName: true, employeeCode: true, orgRole: true } },
          directReports: {
            select: { id: true, fullName: true, employeeCode: true, orgRole: true, jobTitle: true },
          },
          user: { select: { id: true, email: true, role: true } },
          documents: { take: 10, orderBy: { createdAt: "desc" } },
          _count: { select: { directReports: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.leaveRequest.findMany({
        where: leaveWhere,
        include: {
          user: { select: { fullName: true, email: true } },
          approver: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, take: 50 }),
      prisma.holidayCalendar.findMany({
        where: { date: { gte: new Date(new Date().getFullYear(), 0, 1) } },
        orderBy: { date: "asc" },
        take: 100,
      }),
      prisma.workShift.findMany({ where: { active: true }, orderBy: { name: "asc" }, take: 50 }),
      prisma.leaveTypeConfig.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ]);

  // Org tree roots = employees without manager (or managers of everyone)
  const hierarchy = employees
    .filter((e) => !e.managerId)
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      orgRole: e.orgRole,
      jobTitle: e.jobTitle,
      department: e.department?.name ?? null,
      reports: e.directReports,
    }));

  return NextResponse.json({
    employees,
    departments,
    leave,
    branches,
    holidays,
    shifts,
    leaveTypes,
    hierarchy,
    scope: {
      orgRole: auth.scope?.orgRole,
      isFullAccess: auth.scope?.isFullAccess,
      departmentId: auth.scope?.departmentId,
    },
  });
}

const empSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  workPhone: z.string().optional(),
  jobTitle: z.string().min(2),
  designation: z.string().optional(),
  grade: z.string().optional(),
  departmentId: z.string().optional(),
  branchId: z.string().optional(),
  managerId: z.string().optional(),
  orgRole: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional(),
  salaryCents: z.number().int().min(0).optional(),
  userId: z.string().optional(),
  nic: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  qualifications: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE", "TERMINATED"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.hr.manage");
  if (auth.error) return auth.error;

  const body = await request.json();

  // Bulk CSV import: { csv: "fullName,email,jobTitle,..." }
  if (typeof body.csv === "string") {
    const lines = body.csv
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter(Boolean);
    const created = [];
    for (const line of lines.slice(1)) {
      const [fullName, email, jobTitle, departmentCode, orgRole] = line.split(",").map((s) => s.trim());
      if (!fullName || !email || !jobTitle) continue;
      let departmentId: string | undefined;
      if (departmentCode) {
        const dept = await prisma.department.findFirst({
          where: { OR: [{ code: departmentCode }, { name: departmentCode }] },
        });
        departmentId = dept?.id;
      }
      const employee = await prisma.employee.create({
        data: {
          employeeCode: nextNumber("EMP"),
          fullName,
          email,
          jobTitle,
          departmentId,
          orgRole: orgRole || "STAFF",
        },
      });
      created.push(employee);
    }
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "HR",
      entityType: "Employee",
      summary: `Bulk imported ${created.length} employees`,
    });
    return NextResponse.json({ created: created.length, employees: created }, { status: 201 });
  }

  const parsed = empSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
  }

  const { nic, bankAccount, ...rest } = parsed.data;
  const employee = await prisma.employee.create({
    data: {
      employeeCode: nextNumber("EMP"),
      ...rest,
      employmentType: rest.employmentType ?? "FULL_TIME",
      orgRole: rest.orgRole ?? "STAFF",
      nicEncrypted: encryptPii(nic),
      bankAccountEncrypted: encryptPii(bankAccount),
    },
    include: { department: true, branch: true },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "HR",
    entityType: "Employee",
    entityId: employee.id,
    summary: `Employee created: ${employee.employeeCode}`,
  });

  return NextResponse.json({ employee }, { status: 201 });
}

const leaveSchema = z.object({
  leaveType: z
    .enum(["ANNUAL", "CASUAL", "SICK", "UNPAID", "MATERNITY", "PATERNITY", "STUDY", "OTHER"])
    .optional(),
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

  if (body.startDate && !body.leaveId) {
    const parsed = leaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid leave" }, { status: 400 });
    }
    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const leave = await prisma.leaveRequest.create({
      data: {
        userId: auth.user.id,
        leaveType: parsed.data.leaveType ?? "ANNUAL",
        startDate: start,
        endDate: end,
        days,
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

  const action = leaveActionSchema.safeParse(body);
  if (!action.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const manage = await requirePermission("erp.hr.manage");
  if (manage.error) return manage.error;

  const existing = await prisma.leaveRequest.findUnique({ where: { id: action.data.leaveId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leave = await prisma.leaveRequest.update({
    where: { id: action.data.leaveId },
    data: {
      status: action.data.status,
      approverId: auth.user.id,
    },
  });

  const year = leave.startDate.getFullYear();
  const bal = await prisma.leaveBalance.findUnique({
    where: {
      userId_leaveType_year: {
        userId: leave.userId,
        leaveType: leave.leaveType,
        year,
      },
    },
  });
  if (bal) {
    if (action.data.status === "APPROVED") {
      await prisma.leaveBalance.update({
        where: { id: bal.id },
        data: {
          pending: { decrement: leave.days },
          used: { increment: leave.days },
        },
      });
    } else if (action.data.status === "REJECTED" || action.data.status === "CANCELLED") {
      await prisma.leaveBalance.update({
        where: { id: bal.id },
        data: { pending: { decrement: Math.min(bal.pending, leave.days) } },
      });
    }
  }

  await prisma.approvalRequest.updateMany({
    where: {
      referenceType: "LeaveRequest",
      referenceId: leave.id,
      status: "PENDING",
    },
    data: {
      status:
        action.data.status === "APPROVED"
          ? "APPROVED"
          : action.data.status === "REJECTED"
            ? "REJECTED"
            : "CANCELLED",
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

  const { notifyLeaveStatusWhatsApp } = await import("@/lib/crm/whatsapp-notify");
  void notifyLeaveStatusWhatsApp({
    userId: leave.userId,
    status: action.data.status,
    leaveType: leave.leaveType,
  });

  return NextResponse.json({ leave });
}
