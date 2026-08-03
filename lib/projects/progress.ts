import { projectProgressFromTasks } from "@/lib/erp/projects";

type TaskLike = {
  status: string;
  parentId?: string | null;
  progressPct?: number;
};

type MilestoneLike = {
  progressPct?: number;
  status?: string;
};

/** Effective progress: manual override, else tasks, else milestone average */
export function effectiveProjectProgress(
  tasks: TaskLike[],
  milestones: MilestoneLike[],
  overridePct?: number | null
): number {
  if (overridePct != null && overridePct >= 0 && overridePct <= 100) {
    return overridePct;
  }

  const fromTasks = projectProgressFromTasks(
    tasks.map((t, index) => ({
      id: `task-${index}`,
      status: t.status,
      parentId: t.parentId,
      progressPct: t.progressPct ?? 0,
    }))
  );
  if (fromTasks > 0) return fromTasks;

  if (milestones.length === 0) return 0;
  const sum = milestones.reduce((acc, m) => acc + (m.progressPct ?? 0), 0);
  return Math.round(sum / milestones.length);
}

export function currentMilestoneLabel(
  milestones: Array<{ title: string; status: string; dueDate?: Date | string | null }>
): string | null {
  const inProgress = milestones.find((m) => m.status === "IN_PROGRESS");
  if (inProgress) return inProgress.title;

  const pending = milestones
    .filter((m) => m.status === "PENDING")
    .sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return ad - bd;
    });
  return pending[0]?.title ?? milestones[milestones.length - 1]?.title ?? null;
}
