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

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const POMODORO_MINUTES = 25;
