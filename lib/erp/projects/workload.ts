import { PRIORITY_WEIGHT, type TaskPriority } from "@/lib/erp/projects/constants";

export type WorkloadTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimateMinutes: number;
  trackedMinutes: number;
  dueDate?: Date | string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  projectName?: string;
};

export type WorkloadRow = {
  userId: string;
  fullName: string;
  openTasks: number;
  blockedTasks: number;
  estimateMinutes: number;
  trackedMinutes: number;
  overdue: number;
  priorityScore: number;
  capacityPct: number;
  tasks: { id: string; title: string; status: string; priority: string }[];
};

const WEEKLY_CAPACITY_MINUTES = 40 * 60; // 40h

export function buildWorkloadDashboard(tasks: WorkloadTask[]): WorkloadRow[] {
  const map = new Map<string, WorkloadRow>();

  for (const t of tasks) {
    if (!t.assigneeId) continue;
    if (t.status === "DONE") continue;
    let row = map.get(t.assigneeId);
    if (!row) {
      row = {
        userId: t.assigneeId,
        fullName: t.assigneeName || "Unknown",
        openTasks: 0,
        blockedTasks: 0,
        estimateMinutes: 0,
        trackedMinutes: 0,
        overdue: 0,
        priorityScore: 0,
        capacityPct: 0,
        tasks: [],
      };
      map.set(t.assigneeId, row);
    }
    row.openTasks += 1;
    if (t.status === "BLOCKED") row.blockedTasks += 1;
    row.estimateMinutes += t.estimateMinutes || 0;
    row.trackedMinutes += t.trackedMinutes || 0;
    row.priorityScore += PRIORITY_WEIGHT[(t.priority as TaskPriority) || "MEDIUM"] || 2;
    if (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE") {
      row.overdue += 1;
    }
    row.tasks.push({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
    });
  }

  for (const row of Array.from(map.values())) {
    row.capacityPct = Math.min(
      200,
      Math.round((row.estimateMinutes / WEEKLY_CAPACITY_MINUTES) * 100)
    );
  }

  return Array.from(map.values()).sort((a, b) => b.estimateMinutes - a.estimateMinutes);
}

export function ganttBars(
  tasks: {
    id: string;
    title: string;
    status: string;
    startDate?: Date | string | null;
    dueDate?: Date | string | null;
    estimateMinutes?: number;
    progressPct?: number;
  }[]
) {
  const withDates = tasks.filter((t) => t.startDate || t.dueDate);
  if (withDates.length === 0) return { rangeStart: null, rangeEnd: null, bars: [] as const };

  const starts = withDates.map((t) => new Date(t.startDate || t.dueDate!).getTime());
  const ends = withDates.map((t) => {
    const due = t.dueDate ? new Date(t.dueDate).getTime() : null;
    const start = t.startDate ? new Date(t.startDate).getTime() : null;
    if (due) return due;
    if (start && t.estimateMinutes) {
      return start + t.estimateMinutes * 60_000;
    }
    return start || Date.now();
  });

  const rangeStart = Math.min(...starts);
  const rangeEnd = Math.max(...ends, rangeStart + 86400000);
  const span = rangeEnd - rangeStart || 1;

  const bars = withDates.map((t) => {
    const s = new Date(t.startDate || t.dueDate!).getTime();
    const e = t.dueDate
      ? new Date(t.dueDate).getTime()
      : s + Math.max(t.estimateMinutes || 480, 60) * 60_000;
    const left = ((s - rangeStart) / span) * 100;
    const width = Math.max(2, ((Math.max(e, s + 3600000) - s) / span) * 100);
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      progressPct: t.progressPct ?? 0,
      leftPct: Math.max(0, Math.min(98, left)),
      widthPct: Math.min(100 - left, width),
      start: new Date(s).toISOString(),
      end: new Date(e).toISOString(),
    };
  });

  return {
    rangeStart: new Date(rangeStart).toISOString(),
    rangeEnd: new Date(rangeEnd).toISOString(),
    bars,
  };
}
