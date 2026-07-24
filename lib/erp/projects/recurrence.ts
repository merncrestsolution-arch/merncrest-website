/** Next due date for recurring tasks */

export function nextRecurrenceDate(
  from: Date,
  recurrence: string
): Date | null {
  const d = new Date(from);
  switch (recurrence) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      return d;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      return d;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      return d;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      return d;
    default:
      return null;
  }
}

export type RecurrenceSpawnInput = {
  title: string;
  description?: string | null;
  projectId: string;
  milestoneId?: string | null;
  parentId?: string | null;
  priority: string;
  estimateMinutes: number;
  assigneeId?: string | null;
  delegatedById?: string | null;
  recurrence: string;
  dueDate?: Date | null;
  startDate?: Date | null;
};

export function buildRecurrenceClone(
  source: RecurrenceSpawnInput,
  sourceId: string
): RecurrenceSpawnInput & { recurrenceParentId: string; status: string; progressPct: number } | null {
  if (!source.recurrence || source.recurrence === "NONE") return null;
  const base = source.dueDate || source.startDate || new Date();
  const nextDue = nextRecurrenceDate(base, source.recurrence);
  if (!nextDue) return null;
  const nextStart = source.startDate
    ? nextRecurrenceDate(source.startDate, source.recurrence)
    : null;

  return {
    title: source.title,
    description: source.description,
    projectId: source.projectId,
    milestoneId: source.milestoneId,
    parentId: source.parentId,
    priority: source.priority,
    estimateMinutes: source.estimateMinutes,
    assigneeId: source.assigneeId,
    delegatedById: source.delegatedById,
    recurrence: source.recurrence,
    dueDate: nextDue,
    startDate: nextStart,
    recurrenceParentId: sourceId,
    status: "TODO",
    progressPct: 0,
  };
}
