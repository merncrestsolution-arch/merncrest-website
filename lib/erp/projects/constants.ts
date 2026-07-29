/** Task & project management constants */

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

export const MILESTONE_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;

export const RECURRENCE_RULES = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export const DEPENDENCY_TYPES = ["FINISH_TO_START", "START_TO_START", "FINISH_TO_FINISH"] as const;

export const KANBAN_COLUMNS = TASK_STATUSES;

/** Allowed Kanban transitions per column (shown as action buttons on task cards). */
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["IN_REVIEW", "BLOCKED", "TODO"],
  IN_REVIEW: ["DONE", "IN_PROGRESS"],
  DONE: ["IN_REVIEW", "TODO"],
  BLOCKED: ["TODO", "IN_PROGRESS"],
};

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const POMODORO_MINUTES = 25;
