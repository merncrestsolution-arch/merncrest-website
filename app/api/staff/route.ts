import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { getUserPermissions } from "@/lib/erp/permissions";
import { z } from "zod";

/** Internal staff portal home data */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const permissions = await getUserPermissions(auth.user);
  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
    include: { department: true },
  });

  const [tasks, leave, notifications, messages, slips, approvals] = await Promise.all([
    prisma.projectTask.findMany({
      where: { assigneeId: auth.user.id, status: { not: "DONE" } },
      include: { project: { select: { name: true, projectCode: true } } },
      take: 20,
    }),
    prisma.leaveRequest.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.internalMessage.findMany({
      include: { sender: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    employee
      ? prisma.salarySlip.findMany({
          where: { employeeId: employee.id },
          orderBy: { issuedAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    prisma.approvalRequest.findMany({
      where: {
        OR: [{ requesterId: auth.user.id }, { approverId: auth.user.id, status: "PENDING" }],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    user: auth.user,
    employee,
    permissions: Array.from(permissions),
    tasks,
    leave,
    notifications,
    messages,
    salarySlips: slips,
    approvals,
  });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    channel: z.string().optional(),
    body: z.string().min(1).max(2000),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const message = await prisma.internalMessage.create({
    data: {
      senderId: auth.user.id,
      channel: parsed.data.channel || "general",
      body: parsed.data.body,
    },
    include: { sender: { select: { fullName: true } } },
  });
  return NextResponse.json({ message }, { status: 201 });
}
