import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

/** ESS salary slips — staff see own; HR sees all */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
  });

  if (all) {
    const perm = await requirePermission("erp.hr.view");
    if (perm.error) return perm.error;
    const slips = await prisma.salarySlip.findMany({
      orderBy: { issuedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ slips });
  }

  if (!employee) {
    return NextResponse.json({ slips: [], message: "No employee profile linked" });
  }

  const slips = await prisma.salarySlip.findMany({
    where: { employeeId: employee.id },
    orderBy: { issuedAt: "desc" },
    take: 24,
  });

  return NextResponse.json({ slips, employee });
}

/** Generate slips from latest payroll run (HR) */
export async function POST(request: Request) {
  const auth = await requirePermission("erp.hr.manage");
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const schema = z.object({
    payrollRunId: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const run = parsed.data.payrollRunId
    ? await prisma.payrollRun.findUnique({
        where: { id: parsed.data.payrollRunId },
        include: { lines: true },
      })
    : await prisma.payrollRun.findFirst({
        orderBy: { createdAt: "desc" },
        include: { lines: true },
      });

  if (!run || run.lines.length === 0) {
    // Fallback: create slips from active employees with salary
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE", salaryCents: { gt: 0 } },
      take: 50,
    });
    const periodLabel = new Date().toISOString().slice(0, 7);
    const created = [];
    for (const emp of employees) {
      const epf = Math.round(emp.salaryCents * 0.08);
      const slip = await prisma.salarySlip.create({
        data: {
          slipNumber: nextNumber("SLIP"),
          employeeId: emp.id,
          periodLabel,
          grossCents: emp.salaryCents,
          deductionsCents: epf,
          netCents: emp.salaryCents - epf,
          status: "ISSUED",
          metaJson: JSON.stringify({ epf, note: "Auto-generated ESS slip" }),
        },
      });
      created.push(slip);
    }
    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "HR",
      summary: `Generated ${created.length} salary slips for ${periodLabel}`,
    });
    return NextResponse.json({ slips: created, count: created.length }, { status: 201 });
  }

  const created = [];
  for (const line of run.lines) {
    const existing = await prisma.salarySlip.findFirst({
      where: { employeeId: line.employeeId, payrollRunId: run.id },
    });
    if (existing) continue;
    const slip = await prisma.salarySlip.create({
      data: {
        slipNumber: nextNumber("SLIP"),
        employeeId: line.employeeId,
        payrollRunId: run.id,
        periodLabel: run.periodLabel,
        grossCents: line.grossCents,
        deductionsCents: line.deductionsCents,
        netCents: line.netCents,
        status: run.status === "PAID" ? "PAID" : "ISSUED",
        metaJson: line.notes ? JSON.stringify({ notes: line.notes }) : null,
      },
    });
    created.push(slip);
  }

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "HR",
    entityType: "PayrollRun",
    entityId: run.id,
    summary: `Issued ${created.length} salary slips for ${run.periodLabel}`,
  });

  return NextResponse.json({ slips: created, count: created.length }, { status: 201 });
}
