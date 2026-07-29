import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { TASK_STATUSES, POMODORO_MINUTES } from "@/lib/erp/projects/constants";
import { writeAuditLog } from "@/lib/erp/audit";
import { canMutateProject } from "@/lib/projects/access";

/** Staff ESS — assigned / project-member tasks + Pomodoro */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const tasks = await prisma.projectTask.findMany({
    where: {
      OR: [
        { assigneeId: auth.user.id },
        { project: { members: { some: { userId: auth.user.id } } } },
      ],
    },
    include: {
      project: { select: { id: true, projectCode: true, name: true, status: true } },
      milestone: { select: { id: true, title: true } },
      parent: { select: { id: true, title: true } },
      children: { select: { id: true, title: true, status: true, progressPct: true } },
      _count: { select: { comments: true, timeEntries: true } },
    },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
    take: 120,
  });

  const cols = [...TASK_STATUSES];
  const byStatus = Object.fromEntries(
    cols.map((s) => [s, tasks.filter((t) => t.status === s && !t.parentId)])
  );

  const myOpen = tasks.filter(
    (t) => t.assigneeId === auth.user.id && t.status !== "DONE"
  );
  const trackedToday = await prisma.taskTimeEntry.aggregate({
    where: {
      userId: auth.user.id,
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    _sum: { minutes: true },
  });

  return NextResponse.json({
    tasks,
    byStatus,
    stats: {
      open: myOpen.length,
      blocked: myOpen.filter((t) => t.status === "BLOCKED").length,
      trackedMinutesToday: trackedToday._sum.minutes || 0,
    },
  });
}

const patchSchema = z.object({
  taskId: z.string(),
  action: z.enum(["status", "progress", "pomodoro", "comment"]).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  body: z.string().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const task = await prisma.projectTask.findUnique({
    where: { id: parsed.data.taskId },
    select: { id: true, projectId: true, assigneeId: true, title: true, status: true },
  });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const isAssignee = task.assigneeId === auth.user.id;
  const canEdit =
    isAssignee || (await canMutateProject(auth.user, task.projectId));
  if (!canEdit) {
    return NextResponse.json({ error: "Requires edit access on this project" }, { status: 403 });
  }

  const action = parsed.data.action || "status";

  if (action === "comment" && parsed.data.body) {
    const comment = await prisma.taskComment.create({
      data: {
        taskId: task.id,
        authorId: auth.user.id,
        body: parsed.data.body,
      },
    });
    return NextResponse.json({ comment });
  }

  if (action === "pomodoro") {
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - POMODORO_MINUTES * 60_000);
    const entry = await prisma.taskTimeEntry.create({
      data: {
        taskId: task.id,
        userId: auth.user.id,
        kind: "POMODORO",
        minutes: POMODORO_MINUTES,
        startedAt,
        endedAt,
        note: "Focus session",
      },
    });
    const updated = await prisma.projectTask.update({
      where: { id: task.id },
      data: {
        trackedMinutes: { increment: POMODORO_MINUTES },
        status: task.status === "TODO" ? "IN_PROGRESS" : task.status,
      },
    });
    return NextResponse.json({ entry, task: updated, pomodoroMinutes: POMODORO_MINUTES });
  }

  if (action === "progress" && parsed.data.progressPct != null) {
    const pct = parsed.data.progressPct;
    const updated = await prisma.projectTask.update({
      where: { id: task.id },
      data: {
        progressPct: pct,
        status: pct >= 100 ? "DONE" : task.status === "TODO" && pct > 0 ? "IN_PROGRESS" : task.status,
      },
    });
    return NextResponse.json({ task: updated });
  }

  if (!parsed.data.status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  const updated = await prisma.projectTask.update({
    where: { id: task.id },
    data: {
      status: parsed.data.status,
      progressPct: parsed.data.status === "DONE" ? 100 : undefined,
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "PROJECTS",
    entityType: "ProjectTask",
    entityId: updated.id,
    summary: `ESS status → ${updated.status}: ${updated.title}`,
  });

  return NextResponse.json({ task: updated });
}
