import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { notifyUser } from "@/lib/support/notify";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  RECURRENCE_RULES,
  DEPENDENCY_TYPES,
  POMODORO_MINUTES,
  computeCriticalPath,
  projectProgressFromTasks,
  milestoneProgressFromTasks,
  buildRecurrenceClone,
  buildWorkloadDashboard,
  ganttBars,
  computeProjectFinance,
  syncProjectSpent,
  buildProjectClientEmails,
} from "@/lib/erp/projects";
import type { SessionUser } from "@/lib/auth-types";
import { canMutateProject } from "@/lib/projects/access";
import { effectiveProjectProgress } from "@/lib/projects/progress";

async function projectEditGuard(user: SessionUser, projectId: string) {
  if (!(await canMutateProject(user, projectId))) {
    return NextResponse.json({ error: "Requires edit access on this project" }, { status: 403 });
  }
  return null;
}

const taskInclude = {
  assignee: { select: { id: true, fullName: true, email: true } },
  delegatedBy: { select: { id: true, fullName: true } },
  milestone: { select: { id: true, title: true, status: true } },
  children: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      progressPct: true,
      assigneeId: true,
    },
  },
  dependencies: { select: { id: true, dependsOnId: true, type: true } },
  comments: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: { author: { select: { fullName: true } } },
  },
  attachments: { orderBy: { createdAt: "desc" as const }, take: 20 },
  timeEntries: { orderBy: { createdAt: "desc" as const }, take: 10 },
};

export async function GET(request: Request) {
  const auth = await requirePermission(["erp.projects.view", "erp.projects.manage"]);
  if (auth.error) return auth.error;

  try {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");
  const projectId = searchParams.get("projectId");

  if (view === "workload") {
    const tasks = await prisma.projectTask.findMany({
      where: { status: { not: "DONE" }, assigneeId: { not: null } },
      include: {
        assignee: { select: { id: true, fullName: true } },
        project: { select: { name: true } },
      },
      take: 500,
    });
    const workload = buildWorkloadDashboard(
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimateMinutes: t.estimateMinutes,
        trackedMinutes: t.trackedMinutes,
        dueDate: t.dueDate,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.fullName,
        projectName: t.project.name,
      }))
    );
    return NextResponse.json({ workload });
  }

  if (view === "gantt" && projectId) {
    const tasks = await prisma.projectTask.findMany({
      where: { projectId, parentId: null },
      orderBy: [{ startDate: "asc" }, { dueDate: "asc" }],
    });
    return NextResponse.json({ gantt: ganttBars(tasks) });
  }

  if (view === "critical-path" && projectId) {
    const [tasks, deps] = await Promise.all([
      prisma.projectTask.findMany({ where: { projectId, parentId: null } }),
      prisma.taskDependency.findMany({
        where: { task: { projectId } },
      }),
    ]);
    const cpm = computeCriticalPath(tasks, deps);
    return NextResponse.json({ criticalPath: cpm });
  }

  if (view === "finance" && projectId) {
    const project = await prisma.erpProject.findUnique({
      where: { id: projectId },
      include: {
        expenses: { orderBy: { expenseDate: "desc" } },
        payments: { orderBy: { dueDate: "asc" } },
        customer: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const finance = computeProjectFinance({
      budgetCents: project.budgetCents,
      spentCents: project.spentCents,
      revenueCents: project.revenueCents,
      nextPaymentAt: project.nextPaymentAt,
      nextPaymentCents: project.nextPaymentCents,
      expenses: project.expenses,
      payments: project.payments,
    });
    return NextResponse.json({ project, finance });
  }

  if (view === "emails" && projectId) {
    const project = await prisma.erpProject.findUnique({
      where: { id: projectId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            profile: { select: { customerCode: true, phone: true } },
          },
        },
        milestones: { orderBy: { sortOrder: "asc" } },
        clientUpdates: { orderBy: { createdAt: "desc" }, take: 5 },
        tasks: { select: { status: true, parentId: true, progressPct: true } },
      },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const progressPct = projectProgressFromTasks(project.tasks);
    const latest = project.clientUpdates[0] || null;
    const templates = buildProjectClientEmails({
      projectCode: project.projectCode,
      projectName: project.name,
      status: project.status,
      progressPct,
      clientName: project.customer?.fullName,
      clientCompany: project.customer?.company,
      clientEmail: project.customer?.email,
      clientBrief: project.clientBrief,
      nextSteps: project.nextSteps,
      nextProcess: project.nextProcess,
      nextPaymentAt: project.nextPaymentAt,
      nextPaymentCents: project.nextPaymentCents,
      milestones: project.milestones,
      latestUpdate: latest,
      staffName: auth.user.fullName,
    });
    return NextResponse.json({
      customer: project.customer,
      templates,
      clientBrief: project.clientBrief,
      nextSteps: project.nextSteps,
      nextProcess: project.nextProcess,
      updates: project.clientUpdates,
    });
  }

  const projects = await prisma.erpProject.findMany({
    where: projectId ? { id: projectId } : undefined,
    include: {
      department: true,
      customer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          company: true,
          profile: { select: { customerCode: true, phone: true } },
        },
      },
      milestones: { orderBy: { sortOrder: "asc" } },
      expenses: { orderBy: { expenseDate: "desc" }, take: 20 },
      payments: { orderBy: { dueDate: "asc" }, take: 20 },
      clientUpdates: { orderBy: { createdAt: "desc" }, take: 10 },
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: projectId ? 200 : 80,
        include: {
          assignee: { select: { id: true, fullName: true } },
          milestone: { select: { id: true, title: true } },
          children: { select: { id: true, title: true, status: true, progressPct: true } },
          dependencies: true,
          _count: { select: { comments: true, attachments: true, timeEntries: true } },
        },
      },
      members: { include: { user: { select: { id: true, fullName: true, email: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const enriched = projects.map((p) => {
    const progressPct = effectiveProjectProgress(
      p.tasks,
      p.milestones,
      p.progressOverridePct
    );
    const finance = computeProjectFinance({
      budgetCents: p.budgetCents,
      spentCents: p.spentCents,
      revenueCents: p.revenueCents,
      nextPaymentAt: p.nextPaymentAt,
      nextPaymentCents: p.nextPaymentCents,
      expenses: p.expenses,
      payments: p.payments,
    });
    const kanban = {
      TODO: p.tasks.filter((t) => t.status === "TODO" && !t.parentId),
      IN_PROGRESS: p.tasks.filter((t) => t.status === "IN_PROGRESS" && !t.parentId),
      IN_REVIEW: p.tasks.filter((t) => t.status === "IN_REVIEW" && !t.parentId),
      DONE: p.tasks.filter((t) => t.status === "DONE" && !t.parentId),
      BLOCKED: p.tasks.filter((t) => t.status === "BLOCKED" && !t.parentId),
    };
    return { ...p, progressPct, finance, kanban };
  });

  return NextResponse.json({ projects: enriched });
  } catch (error) {
    console.error("[erp/projects:get]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load projects" },
      { status: 500 }
    );
  }
}

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  customerId: z.string().optional(),
  budgetCents: z.number().int().min(0).optional(),
  revenueCents: z.number().int().min(0).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const taskSchema = z.object({
  action: z.literal("create_task").optional(),
  projectId: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  milestoneId: z.string().optional(),
  parentId: z.string().optional(),
  assigneeId: z.string().optional(),
  delegatedById: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  estimateMinutes: z.number().int().min(0).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  recurrence: z.enum(RECURRENCE_RULES).optional(),
  dependsOnId: z.string().optional(),
});

const milestoneSchema = z.object({
  action: z.literal("create_milestone"),
  projectId: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.projects.manage");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.projectId && body.action !== "create_project") {
    const denied = await projectEditGuard(auth.user, body.projectId);
    if (denied) return denied;
  }

  if (body.action === "create_expense") {
    const schema = z.object({
      projectId: z.string(),
      title: z.string().min(2),
      category: z.string().optional(),
      amountCents: z.number().int().min(1),
      expenseDate: z.string().optional(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid expense" }, { status: 400 });
    }
    const expense = await prisma.projectExpense.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        category: parsed.data.category || "GENERAL",
        amountCents: parsed.data.amountCents,
        expenseDate: parsed.data.expenseDate ? new Date(parsed.data.expenseDate) : new Date(),
        notes: parsed.data.notes,
        createdById: auth.user.id,
      },
    });
    const project = await syncProjectSpent(parsed.data.projectId);
    return NextResponse.json({ expense, project }, { status: 201 });
  }

  if (body.action === "create_payment_schedule") {
    const schema = z.object({
      projectId: z.string(),
      label: z.string().min(2),
      amountCents: z.number().int().min(1),
      dueDate: z.string(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment schedule" }, { status: 400 });
    }
    const payment = await prisma.projectPaymentSchedule.create({
      data: {
        projectId: parsed.data.projectId,
        label: parsed.data.label,
        amountCents: parsed.data.amountCents,
        dueDate: new Date(parsed.data.dueDate),
        notes: parsed.data.notes,
      },
    });
    const project = await syncProjectSpent(parsed.data.projectId);
    return NextResponse.json({ payment, project }, { status: 201 });
  }

  if (body.action === "link_customer") {
    const schema = z.object({
      projectId: z.string(),
      customerId: z.string().nullable(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }
    const project = await prisma.erpProject.update({
      where: { id: parsed.data.projectId },
      data: { customerId: parsed.data.customerId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            profile: { select: { customerCode: true, phone: true } },
          },
        },
      },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "PROJECTS",
      entityType: "ErpProject",
      entityId: project.id,
      summary: parsed.data.customerId
        ? `Linked customer ${project.customer?.email || parsed.data.customerId}`
        : "Unlinked customer",
    });
    return NextResponse.json({ project });
  }

  if (body.action === "save_client_plan") {
    const schema = z.object({
      projectId: z.string(),
      clientBrief: z.string().optional(),
      nextSteps: z.string().optional(),
      nextProcess: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid client plan" }, { status: 400 });
    }
    const project = await prisma.erpProject.update({
      where: { id: parsed.data.projectId },
      data: {
        clientBrief: parsed.data.clientBrief,
        nextSteps: parsed.data.nextSteps,
        nextProcess: parsed.data.nextProcess,
      },
    });
    return NextResponse.json({ project });
  }

  if (body.action === "add_client_update") {
    const schema = z.object({
      projectId: z.string(),
      title: z.string().min(2),
      body: z.string().min(2),
      processStage: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }
    const update = await prisma.projectClientUpdate.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        body: parsed.data.body,
        processStage: parsed.data.processStage,
        createdById: auth.user.id,
      },
    });
    if (parsed.data.processStage) {
      await prisma.erpProject.update({
        where: { id: parsed.data.projectId },
        data: { nextProcess: parsed.data.processStage },
      });
    }
    return NextResponse.json({ update }, { status: 201 });
  }

  if (body.action === "create_milestone") {
    const parsed = milestoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid milestone" }, { status: 400 });
    }
    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "PROJECTS",
      entityType: "ProjectMilestone",
      entityId: milestone.id,
      summary: `Milestone ${milestone.title}`,
    });
    return NextResponse.json({ milestone }, { status: 201 });
  }

  if (body.action === "create_task" || (body.title && body.projectId && !body.name)) {
    const parsed = taskSchema.safeParse({ ...body, action: body.action || "create_task" });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid task", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const task = await prisma.projectTask.create({
      data: {
        projectId: d.projectId,
        title: d.title,
        description: d.description,
        milestoneId: d.milestoneId,
        parentId: d.parentId,
        assigneeId: d.assigneeId,
        delegatedById: d.delegatedById || (d.assigneeId ? auth.user.id : undefined),
        status: d.status ?? "TODO",
        priority: d.priority ?? "MEDIUM",
        progressPct: d.progressPct ?? 0,
        estimateMinutes: d.estimateMinutes ?? 0,
        startDate: d.startDate ? new Date(d.startDate) : undefined,
        dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
        recurrence: d.recurrence ?? "NONE",
      },
      include: taskInclude,
    });

    if (d.dependsOnId) {
      await prisma.taskDependency.create({
        data: { taskId: task.id, dependsOnId: d.dependsOnId, type: "FINISH_TO_START" },
      });
    }

    if (d.assigneeId) {
      const { notifyTaskAssignWhatsApp } = await import("@/lib/crm/whatsapp-notify");
      void notifyTaskAssignWhatsApp({ userId: d.assigneeId, taskTitle: d.title });
      void notifyUser({
        userId: d.assigneeId,
        title: `Task assigned: ${d.title}`,
        body: "Open System → Tasks to update status.",
        category: "SYSTEM",
        href: "/staff/tasks",
      });
    }

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "PROJECTS",
      entityType: "ProjectTask",
      entityId: task.id,
      summary: `Task ${task.title}`,
    });

    return NextResponse.json({ task }, { status: 201 });
  }

  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }

  try {
    const project = await prisma.erpProject.create({
      data: {
        projectCode: nextNumber("PRJ"),
        name: parsed.data.name,
        description: parsed.data.description,
        departmentId: parsed.data.departmentId,
        budgetCents: parsed.data.budgetCents ?? 0,
        revenueCents: parsed.data.revenueCents ?? 0,
        customerId: parsed.data.customerId,
        status: parsed.data.status ?? "PLANNING",
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
        members: { create: { userId: auth.user.id, role: "LEAD" } },
      },
      include: { tasks: true, members: true, milestones: true },
    });

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "PROJECTS",
      entityType: "ErpProject",
      entityId: project.id,
      summary: `Project ${project.projectCode} ${project.name}`,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[erp/projects:create]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    );
  }
}

const patchSchema = z.object({
  action: z
    .enum([
      "update_project",
      "update_task",
      "update_milestone",
      "add_dependency",
      "remove_dependency",
      "comment",
      "attach",
      "time_log",
      "pomodoro",
      "delegate",
      "sync_progress",
      "mark_payment_paid",
      "set_revenue",
    ])
    .optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  paymentId: z.string().optional(),
  revenueCents: z.number().int().min(0).optional(),
  customerId: z.string().nullable().optional(),
  status: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  assigneeId: z.string().nullable().optional(),
  estimateMinutes: z.number().int().min(0).optional(),
  trackedMinutes: z.number().int().min(0).optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  recurrence: z.enum(RECURRENCE_RULES).optional(),
  dependsOnId: z.string().optional(),
  dependencyId: z.string().optional(),
  dependencyType: z.enum(DEPENDENCY_TYPES).optional(),
  body: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().optional(),
  minutes: z.number().int().min(1).max(480).optional(),
  note: z.string().optional(),
  budgetCents: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.projects.manage");
  if (auth.error) return auth.error;

  const body = await request.json();

  // Legacy: create task via PATCH (keep compatibility with older UI)
  if (body.title && body.projectId && !body.taskId && !body.action) {
    const denied = await projectEditGuard(auth.user, body.projectId);
    if (denied) return denied;
    const parsedTask = taskSchema.safeParse({ ...body, action: "create_task" });
    if (!parsedTask.success) {
      return NextResponse.json({ error: "Invalid task" }, { status: 400 });
    }
    const td = parsedTask.data;
    const task = await prisma.projectTask.create({
      data: {
        projectId: td.projectId,
        title: td.title,
        description: td.description,
        milestoneId: td.milestoneId,
        parentId: td.parentId,
        assigneeId: td.assigneeId,
        status: td.status ?? "TODO",
        priority: td.priority ?? "MEDIUM",
        estimateMinutes: td.estimateMinutes ?? 0,
        dueDate: td.dueDate ? new Date(td.dueDate) : undefined,
        startDate: td.startDate ? new Date(td.startDate) : undefined,
        recurrence: td.recurrence ?? "NONE",
      },
      include: taskInclude,
    });
    if (td.assigneeId) {
      const { notifyTaskAssignWhatsApp } = await import("@/lib/crm/whatsapp-notify");
      void notifyTaskAssignWhatsApp({ userId: td.assigneeId, taskTitle: td.title });
    }
    return NextResponse.json({ task }, { status: 201 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const d = parsed.data;

  let accessProjectId = d.projectId ?? null;
  if (!accessProjectId && d.taskId) {
    const t = await prisma.projectTask.findUnique({
      where: { id: d.taskId },
      select: { projectId: true },
    });
    accessProjectId = t?.projectId ?? null;
  }
  if (!accessProjectId && d.milestoneId) {
    const m = await prisma.projectMilestone.findUnique({
      where: { id: d.milestoneId },
      select: { projectId: true },
    });
    accessProjectId = m?.projectId ?? null;
  }
  if (!accessProjectId && d.paymentId) {
    const p = await prisma.projectPaymentSchedule.findUnique({
      where: { id: d.paymentId },
      select: { projectId: true },
    });
    accessProjectId = p?.projectId ?? null;
  }
  if (accessProjectId) {
    const denied = await projectEditGuard(auth.user, accessProjectId);
    if (denied) return denied;
  }

  const action = d.action || (d.taskId ? "update_task" : "update_project");

  if (action === "mark_payment_paid" && d.paymentId) {
    const payment = await prisma.projectPaymentSchedule.update({
      where: { id: d.paymentId },
      data: { status: "PAID", paidAt: new Date() },
    });
    const project = await syncProjectSpent(payment.projectId);
    return NextResponse.json({ payment, project });
  }

  if (action === "set_revenue" && d.projectId && d.revenueCents != null) {
    const project = await prisma.erpProject.update({
      where: { id: d.projectId },
      data: {
        revenueCents: d.revenueCents,
        customerId: d.customerId === undefined ? undefined : d.customerId,
      },
    });
    return NextResponse.json({ project });
  }

  if (action === "comment" && d.taskId && d.body) {
    const comment = await prisma.taskComment.create({
      data: { taskId: d.taskId, authorId: auth.user.id, body: d.body },
      include: { author: { select: { fullName: true } } },
    });
    return NextResponse.json({ comment });
  }

  if (action === "attach" && d.taskId && d.fileName && d.fileUrl) {
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: d.taskId,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        uploadedById: auth.user.id,
      },
    });
    return NextResponse.json({ attachment });
  }

  if ((action === "time_log" || action === "pomodoro") && d.taskId) {
    const minutes = action === "pomodoro" ? POMODORO_MINUTES : d.minutes || 25;
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - minutes * 60_000);
    const entry = await prisma.taskTimeEntry.create({
      data: {
        taskId: d.taskId,
        userId: auth.user.id,
        kind: action === "pomodoro" ? "POMODORO" : "MANUAL",
        minutes,
        startedAt,
        endedAt,
        note: d.note,
      },
    });
    const task = await prisma.projectTask.update({
      where: { id: d.taskId },
      data: { trackedMinutes: { increment: minutes } },
    });
    return NextResponse.json({ entry, task });
  }

  if (action === "add_dependency" && d.taskId && d.dependsOnId) {
    if (d.taskId === d.dependsOnId) {
      return NextResponse.json({ error: "Task cannot depend on itself" }, { status: 400 });
    }
    const dep = await prisma.taskDependency.create({
      data: {
        taskId: d.taskId,
        dependsOnId: d.dependsOnId,
        type: d.dependencyType || "FINISH_TO_START",
      },
    });
    return NextResponse.json({ dependency: dep }, { status: 201 });
  }

  if (action === "remove_dependency" && d.dependencyId) {
    await prisma.taskDependency.delete({ where: { id: d.dependencyId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "delegate" && d.taskId && d.assigneeId) {
    const task = await prisma.projectTask.update({
      where: { id: d.taskId },
      data: {
        assigneeId: d.assigneeId,
        delegatedById: auth.user.id,
      },
      include: taskInclude,
    });
    const { notifyTaskAssignWhatsApp } = await import("@/lib/crm/whatsapp-notify");
    void notifyTaskAssignWhatsApp({ userId: d.assigneeId, taskTitle: task.title });
    void notifyUser({
      userId: d.assigneeId,
      title: `Task delegated: ${task.title}`,
      body: `From ${auth.user.fullName}`,
      category: "SYSTEM",
      href: "/staff/tasks",
    });
    return NextResponse.json({ task });
  }

  if (action === "sync_progress" && d.projectId) {
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId: d.projectId },
      include: { tasks: true },
    });
    for (const m of milestones) {
      const { progressPct, status } = milestoneProgressFromTasks(m.tasks);
      await prisma.projectMilestone.update({
        where: { id: m.id },
        data: { progressPct, status },
      });
    }
    return NextResponse.json({ ok: true, synced: milestones.length });
  }

  if (action === "update_milestone" && d.milestoneId) {
    const milestone = await prisma.projectMilestone.update({
      where: { id: d.milestoneId },
      data: {
        title: d.title,
        description: d.description,
        status: d.status,
        dueDate: d.dueDate === null ? null : d.dueDate ? new Date(d.dueDate) : undefined,
        startDate: d.startDate === null ? null : d.startDate ? new Date(d.startDate) : undefined,
        progressPct: d.progressPct,
      },
    });
    return NextResponse.json({ milestone });
  }

  if (action === "update_task" && d.taskId) {
    const before = await prisma.projectTask.findUnique({ where: { id: d.taskId } });
    if (!before) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const progressPct =
      d.status === "DONE" ? 100 : d.progressPct !== undefined ? d.progressPct : undefined;

    const task = await prisma.projectTask.update({
      where: { id: d.taskId },
      data: {
        status: d.status,
        title: d.title,
        description: d.description,
        priority: d.priority,
        progressPct,
        assigneeId: d.assigneeId === undefined ? undefined : d.assigneeId,
        estimateMinutes: d.estimateMinutes,
        trackedMinutes: d.trackedMinutes,
        startDate: d.startDate === null ? null : d.startDate ? new Date(d.startDate) : undefined,
        dueDate: d.dueDate === null ? null : d.dueDate ? new Date(d.dueDate) : undefined,
        recurrence: d.recurrence,
      },
      include: taskInclude,
    });

    // Spawn next occurrence when recurring task completes
    if (d.status === "DONE" && before.status !== "DONE" && before.recurrence !== "NONE") {
      const clone = buildRecurrenceClone(before, before.id);
      if (clone) {
        await prisma.projectTask.create({
          data: {
            projectId: clone.projectId,
            title: clone.title,
            description: clone.description,
            milestoneId: clone.milestoneId,
            parentId: clone.parentId,
            priority: clone.priority,
            estimateMinutes: clone.estimateMinutes,
            assigneeId: clone.assigneeId,
            delegatedById: clone.delegatedById,
            recurrence: clone.recurrence,
            dueDate: clone.dueDate,
            startDate: clone.startDate,
            recurrenceParentId: clone.recurrenceParentId,
            status: "TODO",
            progressPct: 0,
          },
        });
      }
    }

    if (d.assigneeId && d.assigneeId !== before.assigneeId) {
      const { notifyTaskAssignWhatsApp } = await import("@/lib/crm/whatsapp-notify");
      void notifyTaskAssignWhatsApp({ userId: d.assigneeId, taskTitle: task.title });
    }

    return NextResponse.json({ task });
  }

  if (d.projectId) {
    const project = await prisma.erpProject.update({
      where: { id: d.projectId },
      data: {
        status: d.status,
        name: d.title,
        description: d.description,
        budgetCents: d.budgetCents,
        revenueCents: d.revenueCents,
        customerId: d.customerId === undefined ? undefined : d.customerId,
        startDate: d.startDate === null ? null : d.startDate ? new Date(d.startDate) : undefined,
        endDate: d.endDate === null ? null : d.endDate ? new Date(d.endDate) : undefined,
      },
    });
    return NextResponse.json({ project });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
