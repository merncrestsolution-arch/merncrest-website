import type { HostingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateRenewalDate } from "@/shared/renewal-calculator";
import type { BillingCycle } from "@prisma/client";

export async function writeHostingHistory(
  hostingId: string,
  action: string,
  createdBy: string,
  detail?: Prisma.InputJsonValue
) {
  return prisma.serviceHostingHistoryEntry.create({
    data: { hostingId, action, createdBy, detail },
  });
}

export type CreateServiceHostingInput = {
  projectServiceId: string;
  packageName: string;
  diskQuotaMb: number;
  bandwidthQuotaMb: number;
  serverLocation?: string | null;
  expiryDate: Date;
  actorId: string;
};

export async function createServiceHosting(input: CreateServiceHostingInput) {
  const service = await prisma.projectService.findFirst({
    where: {
      id: input.projectServiceId,
      deletedAt: null,
      serviceType: "HOSTING",
    },
    include: { project: true },
  });
  if (!service) return { error: "INVALID_SERVICE" as const };

  const existing = await prisma.serviceHostingAccount.findFirst({
    where: { projectServiceId: input.projectServiceId, deletedAt: null },
  });
  if (existing) return { error: "ALREADY_EXISTS" as const };

  const renewalDate = calculateRenewalDate({
    startDate: service.startDate,
    freePeriodDays: service.freePeriodDays ?? undefined,
    billingCycle: service.billingCycle as BillingCycle,
  });

  const account = await prisma.serviceHostingAccount.create({
    data: {
      projectServiceId: input.projectServiceId,
      packageName: input.packageName,
      diskQuotaMb: input.diskQuotaMb,
      bandwidthQuotaMb: input.bandwidthQuotaMb,
      serverLocation: input.serverLocation ?? null,
      renewalDate,
      expiryDate: input.expiryDate,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    },
  });

  await writeHostingHistory(account.id, "CREATED", input.actorId, {
    packageName: account.packageName,
  });

  return account;
}

export type UpdateServiceHostingInput = {
  packageName?: string;
  diskQuotaMb?: number;
  bandwidthQuotaMb?: number;
  diskUsedMb?: number;
  bandwidthUsedMb?: number;
  serverLocation?: string | null;
  hostingStatus?: HostingStatus;
  expiryDate?: Date;
  actorId: string;
};

export async function updateServiceHosting(
  hostingId: string,
  input: UpdateServiceHostingInput
) {
  const existing = await prisma.serviceHostingAccount.findFirst({
    where: { id: hostingId, deletedAt: null },
    include: { projectService: true },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  const data: Prisma.ServiceHostingAccountUpdateInput = { updatedBy: input.actorId };
  const changes: Record<string, unknown> = {};
  let action = "UPDATED";

  if (input.packageName !== undefined) {
    data.packageName = input.packageName;
    changes.packageName = { from: existing.packageName, to: input.packageName };
    action = "PACKAGE_UPGRADED";
  }
  if (input.diskQuotaMb !== undefined) data.diskQuotaMb = input.diskQuotaMb;
  if (input.bandwidthQuotaMb !== undefined) data.bandwidthQuotaMb = input.bandwidthQuotaMb;
  if (input.diskUsedMb !== undefined) data.diskUsedMb = input.diskUsedMb;
  if (input.bandwidthUsedMb !== undefined) data.bandwidthUsedMb = input.bandwidthUsedMb;
  if (input.serverLocation !== undefined) data.serverLocation = input.serverLocation;
  if (input.hostingStatus !== undefined) {
    data.hostingStatus = input.hostingStatus;
    changes.hostingStatus = { from: existing.hostingStatus, to: input.hostingStatus };
    action = input.hostingStatus === "SUSPENDED" ? "SUSPENDED" : "STATUS_CHANGED";
  }
  if (input.expiryDate !== undefined) data.expiryDate = input.expiryDate;

  const account = await prisma.serviceHostingAccount.update({
    where: { id: hostingId },
    data,
  });

  if (Object.keys(changes).length > 0) {
    await writeHostingHistory(hostingId, action, input.actorId, changes as Prisma.InputJsonValue);
  }

  return account;
}

export async function renewServiceHosting(
  hostingId: string,
  actorId: string,
  newExpiryDate?: Date
) {
  const existing = await prisma.serviceHostingAccount.findFirst({
    where: { id: hostingId, deletedAt: null },
    include: { projectService: true },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  const service = existing.projectService;
  const renewalDate = calculateRenewalDate({
    startDate: new Date(),
    freePeriodDays: service.freePeriodDays ?? undefined,
    billingCycle: service.billingCycle as BillingCycle,
  });

  const account = await prisma.serviceHostingAccount.update({
    where: { id: hostingId },
    data: {
      renewalDate,
      expiryDate: newExpiryDate ?? existing.expiryDate,
      hostingStatus: "ACTIVE",
      updatedBy: actorId,
    },
  });

  await writeHostingHistory(hostingId, "RENEWED", actorId, {
    previousRenewalDate: existing.renewalDate,
    newRenewalDate: renewalDate,
    expiryDate: account.expiryDate,
  });

  return account;
}

export async function softDeleteServiceHosting(hostingId: string, actorId: string) {
  const existing = await prisma.serviceHostingAccount.findFirst({
    where: { id: hostingId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  await prisma.serviceHostingAccount.update({
    where: { id: hostingId },
    data: { deletedAt: new Date(), updatedBy: actorId },
  });

  await writeHostingHistory(hostingId, "DELETED", actorId, {
    packageName: existing.packageName,
  });

  return { id: hostingId };
}

export function computeUsagePercentage(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.round((used / quota) * 1000) / 10;
}

export function serializeHostingUsage(account: {
  diskQuotaMb: number;
  diskUsedMb: number;
  bandwidthQuotaMb: number;
  bandwidthUsedMb: number;
}) {
  return {
    disk: {
      usedMb: account.diskUsedMb,
      quotaMb: account.diskQuotaMb,
      percentage: computeUsagePercentage(account.diskUsedMb, account.diskQuotaMb),
    },
    bandwidth: {
      usedMb: account.bandwidthUsedMb,
      quotaMb: account.bandwidthQuotaMb,
      percentage: computeUsagePercentage(
        account.bandwidthUsedMb,
        account.bandwidthQuotaMb
      ),
    },
  };
}

export function serializeServiceHosting(
  account: Prisma.ServiceHostingAccountGetPayload<object>
) {
  return {
    id: account.id,
    projectServiceId: account.projectServiceId,
    packageName: account.packageName,
    diskQuotaMb: account.diskQuotaMb,
    bandwidthQuotaMb: account.bandwidthQuotaMb,
    diskUsedMb: account.diskUsedMb,
    bandwidthUsedMb: account.bandwidthUsedMb,
    serverLocation: account.serverLocation,
    hostingStatus: account.hostingStatus,
    renewalDate: account.renewalDate,
    expiryDate: account.expiryDate,
    usage: serializeHostingUsage(account),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
