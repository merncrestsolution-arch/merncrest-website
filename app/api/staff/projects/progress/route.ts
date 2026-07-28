import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { isAdminRole } from "@/lib/auth";
import {
  currentMilestoneLabel,
  effectiveProjectProgress,
} from "@/lib/projects/progress";
import { requireProjectAccess } from "@/lib/projects/access";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const projects = await prisma.erpProject.findMany({
    where: {
      status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] },
    },
    include: {
      customer: { select: { id: true, fullName: true, company: true } },
      milestones: { orderBy: { sortOrder: "asc" } },
      tasks: { select: { status: true, parentId: true, progressPct: true } },
      clientUpdates: { orderBy: { createdAt: "desc" }, take: 1 },
      backlogItems: {
        where: { deletedAt: null, status: "BACKLOG" },
        select: { id: true },
      },
    },
    orderBy: [{ status: "asc" }, { endDate: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const scoped = isAdminRole(auth.user.role)
    ? projects
    : await (async () => {
        const memberIds = await prisma.projectMember.findMany({
          where: { userId: auth.user.id, deletedAt: null },
          select: { projectId: true },
        });
        const ids = new Set(memberIds.map((m) => m.projectId));
        return projects.filter((p) => ids.has(p.id));
      })();

  const rows = scoped.map((p) => {
    const progressPct = effectiveProjectProgress(
      p.tasks,
      p.milestones,
      p.progressOverridePct
    );
    const latestUpdate = p.clientUpdates[0] ?? null;
    const upcomingDeadline =
      p.milestones
        .filter((m) => m.status !== "DONE" && m.dueDate)
        .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))[0]?.dueDate ??
      p.endDate;

    return {
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      status: p.status,
      progressPct,
      progressOverridePct: p.progressOverridePct,
      currentMilestone: currentMilestoneLabel(p.milestones),
      latestUpdate: latestUpdate
        ? {
            id: latestUpdate.id,
            title: latestUpdate.title,
            body: latestUpdate.body,
            createdAt: latestUpdate.createdAt,
          }
        : null,
      upcomingDeadline,
      endDate: p.endDate,
      client: p.customer
        ? {
            id: p.customer.id,
            name: p.customer.company || p.customer.fullName,
          }
        : null,
      backlogCount: p.backlogItems.length,
      openTaskCount: p.tasks.filter((t) => t.status !== "DONE" && !t.parentId).length,
    };
  });

  return apiSuccess(rows);
}
