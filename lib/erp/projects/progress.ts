import type { TaskStatus } from "@/lib/erp/projects/constants";

export type ProgressTask = {
  id: string;
  status: string;
  progressPct: number;
  parentId?: string | null;
  estimateMinutes?: number;
  trackedMinutes?: number;
};

/** Leaf-aware progress: DONE=100, else use progressPct; roll up children. */
export function taskProgressPct(task: ProgressTask, children: ProgressTask[] = []): number {
  if (task.status === "DONE") return 100;
  if (children.length > 0) {
    const sum = children.reduce((acc, c) => acc + taskProgressPct(c), 0);
    return Math.round(sum / children.length);
  }
  if (task.status === "BLOCKED") return Math.min(task.progressPct, 99);
  return Math.max(0, Math.min(100, task.progressPct));
}

export function projectProgressFromTasks(tasks: ProgressTask[]): number {
  const roots = tasks.filter((t) => !t.parentId);
  const list = roots.length > 0 ? roots : tasks;
  if (list.length === 0) return 0;
  const byParent = new Map<string, ProgressTask[]>();
  for (const t of tasks) {
    if (!t.parentId) continue;
    const arr = byParent.get(t.parentId) || [];
    arr.push(t);
    byParent.set(t.parentId, arr);
  }
  const sum = list.reduce((acc, t) => acc + taskProgressPct(t, byParent.get(t.id) || []), 0);
  return Math.round(sum / list.length);
}

export function milestoneProgressFromTasks(tasks: ProgressTask[]): {
  progressPct: number;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
} {
  if (tasks.length === 0) return { progressPct: 0, status: "PENDING" };
  const pct = projectProgressFromTasks(tasks);
  const allDone = tasks.every((t) => t.status === "DONE");
  const anyStarted = tasks.some((t) => t.status !== "TODO");
  return {
    progressPct: allDone ? 100 : pct,
    status: allDone ? "DONE" : anyStarted || pct > 0 ? "IN_PROGRESS" : "PENDING",
  };
}

export function statusFromProgress(pct: number, current: TaskStatus): TaskStatus {
  if (pct >= 100) return "DONE";
  if (current === "BLOCKED" || current === "IN_REVIEW") return current;
  if (pct > 0) return "IN_PROGRESS";
  return "TODO";
}
