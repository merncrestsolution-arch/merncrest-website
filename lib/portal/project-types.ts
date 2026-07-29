import { effectiveProjectProgress } from "@/lib/projects/progress";

/** Customer-facing custom project / software service types */
export const PORTAL_PROJECT_TYPES = [
  {
    value: "WEBSITE",
    label: "Website / web application",
    interest: "Custom website / web app",
  },
  {
    value: "MOBILE_APP",
    label: "Mobile app (iOS / Android)",
    interest: "Custom mobile app",
  },
  {
    value: "CUSTOM_SOFTWARE",
    label: "Custom software / ERP / SaaS",
    interest: "Custom software development",
  },
  {
    value: "AI_SOLUTION",
    label: "AI solution / automation",
    interest: "AI solution",
  },
  {
    value: "DIGITAL_TRANSFORMATION",
    label: "Digital transformation / consulting",
    interest: "Digital transformation",
  },
  {
    value: "OTHER",
    label: "Other project services",
    interest: "Other project services",
  },
] as const;

export type PortalProjectType = (typeof PORTAL_PROJECT_TYPES)[number]["value"];

export function projectTypeLabel(value: string) {
  return PORTAL_PROJECT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function projectTypeInterest(value: string) {
  return PORTAL_PROJECT_TYPES.find((t) => t.value === value)?.interest ?? value;
}

/** Sanitize ERP project for customer portal (no budget/spend/internal costs) */
export function toPortalProject(project: {
  id: string;
  projectCode: string;
  name: string;
  description: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  updatedAt: Date;
  clientBrief?: string | null;
  nextSteps?: string | null;
  nextProcess?: string | null;
  nextPaymentAt?: Date | null;
  nextPaymentCents?: number;
  progressOverridePct?: number | null;
  milestones?: { id: string; title: string; status: string; dueDate: Date | null; progressPct?: number }[];
  tasks?: { status: string; parentId?: string | null; progressPct?: number }[];
  payments?: {
    id: string;
    label: string;
    amountCents: number;
    dueDate: Date;
    status: string;
  }[];
  clientUpdates?: {
    id: string;
    title: string;
    body: string;
    processStage: string | null;
    createdAt: Date;
  }[];
}) {
  const milestones = project.milestones ?? [];
  const tasks = project.tasks ?? [];
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const progressPct = effectiveProjectProgress(
    tasks,
    milestones,
    project.progressOverridePct
  );

  return {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    updatedAt: project.updatedAt,
    progressPct,
    clientBrief: project.clientBrief ?? null,
    nextSteps: project.nextSteps ?? null,
    nextProcess: project.nextProcess ?? null,
    nextPaymentAt: project.nextPaymentAt ?? null,
    nextPaymentCents: project.nextPaymentCents ?? 0,
    milestones: milestones.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      dueDate: m.dueDate,
    })),
    schedule: (project.payments || []).map((p) => ({
      id: p.id,
      label: p.label,
      amountCents: p.amountCents,
      dueDate: p.dueDate,
      status: p.status,
    })),
    updates: (project.clientUpdates || []).map((u) => ({
      id: u.id,
      title: u.title,
      body: u.body,
      processStage: u.processStage,
      createdAt: u.createdAt,
    })),
    taskSummary: {
      total: tasks.length,
      done: doneTasks,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    },
  };
}
