import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { loadProjectHub } from "@/lib/staff/project-hub";
import { effectiveProjectProgress } from "@/lib/projects/progress";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const erpProject = await prisma.erpProject.findFirst({
    where: { id, customerId: auth.user.id },
    include: {
      milestones: { orderBy: { sortOrder: "asc" } },
      tasks: true,
      clientUpdates: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!erpProject) return apiError("NOT_FOUND", "Project not found", 404);

  const hub = await loadProjectHub(id);
  if (!hub) return apiError("NOT_FOUND", "Project not found", 404);

  const progressPct = effectiveProjectProgress(
    erpProject.tasks,
    erpProject.milestones,
    erpProject.progressOverridePct
  );

  const git =
    hub.resources && hub.resources.clientCanViewGit
      ? {
          provider: hub.resources.gitProvider,
          url: hub.resources.gitRepoUrl,
          defaultBranch: hub.resources.defaultBranch,
          deploymentBranch: hub.resources.deploymentBranch,
          latestCommitSha: hub.resources.latestCommitSha,
          latestCommitMessage: hub.resources.latestCommitMessage,
          latestCommitAt: hub.resources.latestCommitAt,
          repositoryStatus: hub.resources.repositoryStatus,
        }
      : null;

  return apiSuccess({
    project: {
      id: hub.erpProject.id,
      name: hub.erpProject.name,
      projectCode: hub.erpProject.projectCode,
      status: hub.erpProject.status,
      startDate: hub.erpProject.startDate,
      endDate: hub.erpProject.endDate,
      clientBrief: hub.erpProject.clientBrief,
      nextSteps: hub.erpProject.nextSteps,
      nextProcess: hub.erpProject.nextProcess,
    },
    progress: {
      percent: progressPct,
      currentMilestone: hub.progress.currentMilestone,
      completedMilestones: hub.progress.completedMilestones,
      totalMilestones: hub.progress.totalMilestones,
      pendingTasks: hub.progress.pendingTasks,
      completedTasks: hub.progress.completedTasks,
      totalTasks: hub.progress.totalTasks,
    },
    milestones: hub.milestones,
    clientUpdates: hub.clientUpdates,
    domains: hub.servicesByType.domains.map((s) => ({
      id: s.id,
      label: s.label,
      domain: s.domain,
    })),
    hosting: hub.servicesByType.hosting.map((s) => ({
      id: s.id,
      label: s.label,
      hosting: s.hosting,
    })),
    ssl: hub.servicesByType.ssl,
    security: hub.servicesByType.security,
    email: hub.servicesByType.email,
    billing: hub.billing.summary,
    invoices: hub.billing.invoices.slice(0, 10),
    renewals: hub.renewals,
    dnsSummary: hub.dnsSummary,
    deployment: hub.deploymentStatus,
    git,
    documentation: {
      docsUrl: hub.resources?.docsUrl ?? null,
      apiDocsUrl: hub.resources?.apiDocsUrl ?? null,
    },
    activity: hub.activity.slice(0, 20),
  });
}
