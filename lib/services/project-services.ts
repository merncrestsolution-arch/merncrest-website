import { Prisma } from "@prisma/client";
import type { BillingCycle, ServiceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateRenewalDate } from "@/shared/renewal-calculator";
import { validateServiceMetadata } from "@/shared/service-types";

export type CreateProjectServiceInput = {
  projectId: string;
  serviceType: ServiceType;
  startDate: Date;
  freePeriodDays?: number | null;
  billingCycle?: BillingCycle;
  expiryDate?: Date | null;
  metadata?: unknown;
  reminderScheduleDays?: number[];
  actorId: string;
};

export type UpdateProjectServiceInput = {
  status?: Prisma.ProjectServiceUpdateInput["status"];
  startDate?: Date;
  freePeriodDays?: number | null;
  billingCycle?: BillingCycle;
  expiryDate?: Date | null;
  metadata?: unknown;
  reminderScheduleDays?: number[];
  actorId: string;
};

function computeRenewalForService(input: {
  startDate: Date;
  freePeriodDays?: number | null;
  billingCycle: BillingCycle;
}): Date {
  return calculateRenewalDate({
    startDate: input.startDate,
    freePeriodDays: input.freePeriodDays ?? undefined,
    billingCycle: input.billingCycle,
  });
}

export async function createProjectService(input: CreateProjectServiceInput) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, deletedAt: null },
  });
  if (!project) return { error: "NOT_FOUND" as const };

  const billingCycle = input.billingCycle ?? "ANNUAL";
  const metadata = input.metadata
    ? (validateServiceMetadata(input.serviceType, input.metadata) as Prisma.InputJsonValue)
    : undefined;
  const renewalDate = computeRenewalForService({
    startDate: input.startDate,
    freePeriodDays: input.freePeriodDays,
    billingCycle,
  });

  return prisma.projectService.create({
    data: {
      projectId: input.projectId,
      serviceType: input.serviceType,
      startDate: input.startDate,
      freePeriodDays: input.freePeriodDays ?? null,
      billingCycle,
      renewalDate,
      expiryDate: input.expiryDate ?? null,
      metadata,
      reminderScheduleDays: input.reminderScheduleDays ?? [3],
      createdBy: input.actorId,
      updatedBy: input.actorId,
    },
  });
}

export async function updateProjectService(
  serviceId: string,
  projectId: string,
  input: UpdateProjectServiceInput
) {
  const existing = await prisma.projectService.findFirst({
    where: { id: serviceId, projectId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  const startDate = input.startDate ?? existing.startDate;
  const freePeriodDays =
    input.freePeriodDays !== undefined ? input.freePeriodDays : existing.freePeriodDays;
  const billingCycle = input.billingCycle ?? existing.billingCycle;

  const renewalFieldsChanged =
    input.startDate !== undefined ||
    input.freePeriodDays !== undefined ||
    input.billingCycle !== undefined;

  const metadata =
    input.metadata !== undefined
      ? input.metadata
        ? (validateServiceMetadata(existing.serviceType, input.metadata) as Prisma.InputJsonValue)
        : null
      : undefined;

  const data: Prisma.ProjectServiceUpdateInput = {
    updatedBy: input.actorId,
  };
  if (input.status !== undefined) data.status = input.status;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.freePeriodDays !== undefined) data.freePeriodDays = input.freePeriodDays;
  if (input.billingCycle !== undefined) data.billingCycle = input.billingCycle;
  if (input.expiryDate !== undefined) data.expiryDate = input.expiryDate;
  if (input.reminderScheduleDays !== undefined) {
    data.reminderScheduleDays = input.reminderScheduleDays;
  }
  if (metadata !== undefined) {
    data.metadata = metadata === null ? Prisma.JsonNull : metadata;
  }

  if (renewalFieldsChanged) {
    data.renewalDate = computeRenewalForService({
      startDate,
      freePeriodDays,
      billingCycle,
    });
  }

  return prisma.projectService.update({
    where: { id: serviceId },
    data,
  });
}

export async function softDeleteProjectService(
  serviceId: string,
  projectId: string,
  actorId: string
) {
  const existing = await prisma.projectService.findFirst({
    where: { id: serviceId, projectId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  return prisma.projectService.update({
    where: { id: serviceId },
    data: { deletedAt: new Date(), updatedBy: actorId },
  });
}

export function serializeProjectService(
  service: Prisma.ProjectServiceGetPayload<object>
) {
  return {
    id: service.id,
    projectId: service.projectId,
    serviceType: service.serviceType,
    status: service.status,
    startDate: service.startDate,
    freePeriodDays: service.freePeriodDays,
    billingCycle: service.billingCycle,
    renewalDate: service.renewalDate,
    expiryDate: service.expiryDate,
    metadata: service.metadata,
    reminderScheduleDays: service.reminderScheduleDays,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}
