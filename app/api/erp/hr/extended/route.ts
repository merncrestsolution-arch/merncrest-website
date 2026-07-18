import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission, requireErpStaff } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.hr.view", "erp.hr.manage"]);
  if (auth.error) return auth.error;

  const [attendance, jobs, payroll] = await Promise.all([
    prisma.attendanceRecord.findMany({
      include: { employee: { select: { fullName: true, employeeCode: true } } },
      orderBy: { workDate: "desc" },
      take: 40,
    }),
    prisma.jobOpening.findMany({
      include: { applications: { take: 10, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.payrollRun.findMany({
      include: { lines: { include: { employee: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ attendance, jobs, payroll });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.hr.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = body.action as string;

  if (action === "attendance") {
    const schema = z.object({
      employeeId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "REMOTE"]).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId: parsed.data.employeeId,
        userId: auth.user.id,
        workDate: new Date(),
        checkIn: new Date(),
        status: parsed.data.status ?? "PRESENT",
      },
    });
    return NextResponse.json({ record }, { status: 201 });
  }

  if (action === "job") {
    const schema = z.object({
      title: z.string().min(2),
      department: z.string().optional(),
      description: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const job = await prisma.jobOpening.create({ data: parsed.data });
    return NextResponse.json({ job }, { status: 201 });
  }

  if (action === "apply") {
    const schema = z.object({
      jobOpeningId: z.string(),
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const application = await prisma.jobApplication.create({ data: parsed.data });
    return NextResponse.json({ application }, { status: 201 });
  }

  if (action === "payroll") {
    const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });
    const lines = employees.map((e) => {
      const deductions = Math.round(e.salaryCents * 0.08);
      return {
        employeeId: e.id,
        grossCents: e.salaryCents,
        deductionsCents: deductions,
        netCents: e.salaryCents - deductions,
      };
    });
    const totalCents = lines.reduce((s, l) => s + l.netCents, 0);
    const run = await prisma.payrollRun.create({
      data: {
        runNumber: nextNumber("PAY"),
        periodLabel: new Date().toLocaleString("en", { month: "long", year: "numeric" }),
        status: "DRAFT",
        totalCents,
        lines: { create: lines },
      },
      include: { lines: true },
    });
    return NextResponse.json({ run }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await requireErpStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body.payrollRunId && body.status) {
    const manage = await requirePermission("erp.hr.manage");
    if (manage.error) return manage.error;
    const run = await prisma.payrollRun.update({
      where: { id: body.payrollRunId },
      data: { status: body.status },
    });
    return NextResponse.json({ run });
  }
  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
