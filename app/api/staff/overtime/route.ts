import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";

const schema = z.object({
  workDate: z.string(),
  hours: z.number().min(0.5).max(12),
  reason: z.string().max(1000).optional(),
});

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const rows = await prisma.overtimeRequest.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ overtime: rows });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid overtime" }, { status: 400 });

  const employee = await prisma.employee.findFirst({ where: { userId: auth.user.id } });
  const ot = await prisma.overtimeRequest.create({
    data: {
      userId: auth.user.id,
      employeeId: employee?.id,
      workDate: new Date(parsed.data.workDate),
      hours: parsed.data.hours,
      reason: parsed.data.reason,
      status: "PENDING",
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "HR",
    entityType: "OvertimeRequest",
    entityId: ot.id,
    summary: `Overtime requested: ${ot.hours}h`,
  });

  return NextResponse.json({ overtime: ot }, { status: 201 });
}
