import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.projects.view", "erp.projects.manage"]);
  if (auth.error) return auth.error;

  const projects = await prisma.erpProject.findMany({
    include: {
      department: true,
      tasks: { orderBy: { createdAt: "desc" }, take: 20 },
      members: { include: { user: { select: { fullName: true, email: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ projects });
}

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  budgetCents: z.number().int().min(0).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.projects.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }

  const project = await prisma.erpProject.create({
    data: {
      projectCode: nextNumber("PRJ"),
      name: parsed.data.name,
      description: parsed.data.description,
      departmentId: parsed.data.departmentId,
      budgetCents: parsed.data.budgetCents ?? 0,
      status: parsed.data.status ?? "PLANNING",
      members: {
        create: { userId: auth.user.id, role: "LEAD" },
      },
    },
    include: { tasks: true, members: true },
  });
  return NextResponse.json({ project }, { status: 201 });
}

const taskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
});

const patchSchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  status: z.string().optional(),
  title: z.string().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.projects.manage");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.title && body.projectId && !body.taskId) {
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid task" }, { status: 400 });
    }
    const task = await prisma.projectTask.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description,
        assigneeId: parsed.data.assigneeId,
        status: parsed.data.status ?? "TODO",
      },
    });
    return NextResponse.json({ task }, { status: 201 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  if (parsed.data.taskId) {
    const task = await prisma.projectTask.update({
      where: { id: parsed.data.taskId },
      data: { status: parsed.data.status, title: parsed.data.title },
    });
    return NextResponse.json({ task });
  }

  if (parsed.data.projectId) {
    const project = await prisma.erpProject.update({
      where: { id: parsed.data.projectId },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ project });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
