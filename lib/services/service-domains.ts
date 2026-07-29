import type { DomainStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SL_TIMEZONE } from "@/lib/timezone";
import { parseDomainParts } from "@/shared/domain-registrars";
import { DNS_RECORDS_SCHEMA } from "@/shared/service-types";

const EXPIRING_SOON_DAYS = 30;

function daysUntilExpiryInSL(expiryDate: Date): number {
  const now = new Date();
  const today = new Date(now.toLocaleString("en-US", { timeZone: SL_TIMEZONE }));
  const expLocal = new Date(expiryDate.toLocaleString("en-US", { timeZone: SL_TIMEZONE }));
  return Math.ceil((expLocal.getTime() - today.getTime()) / 86400000);
}

export function computeEffectiveDomainStatus(
  storedStatus: DomainStatus,
  expiryDate: Date
): DomainStatus {
  if (storedStatus === "TRANSFERRED" || storedStatus === "SUSPENDED") {
    return storedStatus;
  }
  const days = daysUntilExpiryInSL(expiryDate);
  if (days < 0) return "EXPIRED";
  if (days <= EXPIRING_SOON_DAYS) return "EXPIRING_SOON";
  return storedStatus === "EXPIRED" ? "EXPIRED" : "ACTIVE";
}

export async function writeDomainHistory(
  domainId: string,
  action: string,
  createdBy: string,
  detail?: Prisma.InputJsonValue
) {
  return prisma.serviceDomainHistoryEntry.create({
    data: { domainId, action, createdBy, detail },
  });
}

export type CreateServiceDomainInput = {
  projectServiceId: string;
  domainName: string;
  registrar?: string | null;
  purchasedViaMernCrest?: boolean;
  registrationDate: Date;
  expiryDate: Date;
  renewalDate?: Date | null;
  registrationPeriodMonths?: number | null;
  nameservers?: string[];
  dnsRecords?: unknown;
  dnsZone?: string | null;
  sslCertificateStatus?: string;
  autoRenew?: boolean;
  whoisStatus?: string | null;
  domainStatus?: DomainStatus;
  actorId: string;
};

export async function createServiceDomain(input: CreateServiceDomainInput) {
  const service = await prisma.projectService.findFirst({
    where: {
      id: input.projectServiceId,
      deletedAt: null,
      serviceType: "DOMAIN_REGISTRATION",
    },
  });
  if (!service) return { error: "INVALID_SERVICE" as const };

  const existing = await prisma.serviceDomain.findFirst({
    where: { projectServiceId: input.projectServiceId, deletedAt: null },
  });
  if (existing) return { error: "ALREADY_EXISTS" as const };

  const dnsRecords = input.dnsRecords
    ? DNS_RECORDS_SCHEMA.parse(input.dnsRecords)
    : null;

  const { extension } = parseDomainParts(input.domainName);

  const domain = await prisma.serviceDomain.create({
    data: {
      projectServiceId: input.projectServiceId,
      domainName: input.domainName,
      domainExtension: extension || null,
      registrar: input.registrar ?? null,
      purchasedViaMernCrest: input.purchasedViaMernCrest ?? false,
      registrationDate: input.registrationDate,
      expiryDate: input.expiryDate,
      renewalDate: input.renewalDate ?? null,
      registrationPeriodMonths: input.registrationPeriodMonths ?? null,
      nameservers: input.nameservers ?? [],
      dnsRecords: dnsRecords ?? undefined,
      dnsZone: input.dnsZone ?? input.domainName,
      sslCertificateStatus: input.sslCertificateStatus ?? "UNKNOWN",
      autoRenew: input.autoRenew ?? false,
      whoisStatus: input.whoisStatus ?? null,
      domainStatus: input.domainStatus ?? "ACTIVE",
      createdBy: input.actorId,
      updatedBy: input.actorId,
    },
  });

  await writeDomainHistory(domain.id, "CREATED", input.actorId, {
    domainName: domain.domainName,
  });

  return domain;
}

export type UpdateServiceDomainInput = {
  registrar?: string | null;
  registrationDate?: Date;
  expiryDate?: Date;
  renewalDate?: Date | null;
  registrationPeriodMonths?: number | null;
  dnsZone?: string | null;
  sslCertificateStatus?: string;
  autoRenew?: boolean;
  whoisStatus?: string | null;
  domainStatus?: DomainStatus;
  purchasedViaMernCrest?: boolean;
  actorId: string;
};

export async function updateServiceDomain(
  domainId: string,
  input: UpdateServiceDomainInput,
  options: { fullLifecycle: boolean }
) {
  const existing = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  const canMutateLifecycle = existing.purchasedViaMernCrest && options.fullLifecycle;
  const informationalOnly = !existing.purchasedViaMernCrest;

  const data: Prisma.ServiceDomainUpdateInput = { updatedBy: input.actorId };
  const changes: Record<string, unknown> = {};

  if (input.registrar !== undefined) {
    data.registrar = input.registrar;
    changes.registrar = input.registrar;
  }
  if (input.registrationDate !== undefined) {
    data.registrationDate = input.registrationDate;
    changes.registrationDate = input.registrationDate;
  }
  if (input.expiryDate !== undefined) {
    data.expiryDate = input.expiryDate;
    changes.expiryDate = input.expiryDate;
  }
  if (input.renewalDate !== undefined) {
    data.renewalDate = input.renewalDate;
    changes.renewalDate = input.renewalDate;
  }
  if (input.registrationPeriodMonths !== undefined) {
    data.registrationPeriodMonths = input.registrationPeriodMonths;
    changes.registrationPeriodMonths = input.registrationPeriodMonths;
  }
  if (input.dnsZone !== undefined) {
    data.dnsZone = input.dnsZone;
    changes.dnsZone = input.dnsZone;
  }
  if (input.sslCertificateStatus !== undefined) {
    data.sslCertificateStatus = input.sslCertificateStatus;
    changes.sslCertificateStatus = input.sslCertificateStatus;
  }
  if (input.autoRenew !== undefined) {
    data.autoRenew = input.autoRenew;
    changes.autoRenew = input.autoRenew;
  }
  if (input.whoisStatus !== undefined) {
    data.whoisStatus = input.whoisStatus;
    changes.whoisStatus = input.whoisStatus;
  }

  if (canMutateLifecycle || informationalOnly) {
    if (input.domainStatus !== undefined && canMutateLifecycle) {
      data.domainStatus = input.domainStatus;
      changes.domainStatus = input.domainStatus;
    }
  } else if (input.domainStatus !== undefined) {
    return { error: "LIFECYCLE_LOCKED" as const };
  }

  const domain = await prisma.serviceDomain.update({ where: { id: domainId }, data });

  if (Object.keys(changes).length > 0) {
    const action = changes.domainStatus ? "STATUS_CHANGED" : "UPDATED";
    await writeDomainHistory(domainId, action, input.actorId, changes as Prisma.InputJsonValue);
  }

  return domain;
}

export async function renewServiceDomain(
  domainId: string,
  newExpiryDate: Date,
  actorId: string
) {
  const existing = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };
  if (!existing.purchasedViaMernCrest) return { error: "LIFECYCLE_LOCKED" as const };

  const domain = await prisma.serviceDomain.update({
    where: { id: domainId },
    data: {
      expiryDate: newExpiryDate,
      domainStatus: "ACTIVE",
      updatedBy: actorId,
    },
  });

  await writeDomainHistory(domainId, "RENEWED", actorId, {
    previousExpiryDate: existing.expiryDate,
    newExpiryDate,
  });

  return domain;
}

export async function updateDomainNameservers(
  domainId: string,
  nameservers: string[],
  actorId: string
) {
  const existing = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };
  if (!existing.purchasedViaMernCrest) return { error: "LIFECYCLE_LOCKED" as const };

  const domain = await prisma.serviceDomain.update({
    where: { id: domainId },
    data: { nameservers, updatedBy: actorId },
  });

  await writeDomainHistory(domainId, "NAMESERVER_UPDATED", actorId, {
    previous: existing.nameservers,
    current: nameservers,
  });

  return domain;
}

export async function updateDomainDnsRecords(
  domainId: string,
  dnsRecords: unknown,
  actorId: string,
  action: "DNS_RECORD_ADDED" | "DNS_RECORD_UPDATED" | "DNS_RECORD_REMOVED"
) {
  const existing = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };
  if (!existing.purchasedViaMernCrest) return { error: "LIFECYCLE_LOCKED" as const };

  const parsed = DNS_RECORDS_SCHEMA.parse(dnsRecords);

  const domain = await prisma.serviceDomain.update({
    where: { id: domainId },
    data: { dnsRecords: parsed, updatedBy: actorId },
  });

  await writeDomainHistory(domainId, action, actorId, {
    previous: existing.dnsRecords,
    current: parsed,
  });

  return domain;
}

export async function softDeleteServiceDomain(domainId: string, actorId: string) {
  const existing = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  await prisma.serviceDomain.update({
    where: { id: domainId },
    data: { deletedAt: new Date(), updatedBy: actorId },
  });

  await writeDomainHistory(domainId, "DELETED", actorId, {
    domainName: existing.domainName,
  });

  return { id: domainId };
}

export function serializeServiceDomain(
  domain: Prisma.ServiceDomainGetPayload<{ include: { history: true } }> | Prisma.ServiceDomainGetPayload<object>
) {
  const effectiveStatus = computeEffectiveDomainStatus(domain.domainStatus, domain.expiryDate);

  let registrationPeriodMonths = domain.registrationPeriodMonths;
  if (!registrationPeriodMonths && domain.registrationDate && domain.expiryDate) {
    registrationPeriodMonths = Math.max(
      1,
      Math.round(
        (domain.expiryDate.getTime() - domain.registrationDate.getTime()) / (30.44 * 86400000)
      )
    );
  }

  const renewalDate =
    domain.renewalDate ??
    (domain.autoRenew && domain.expiryDate ? domain.expiryDate : null);

  return {
    id: domain.id,
    projectServiceId: domain.projectServiceId,
    domainName: domain.domainName,
    domainExtension: domain.domainExtension,
    registrar: domain.registrar,
    purchasedViaMernCrest: domain.purchasedViaMernCrest,
    registrationDate: domain.registrationDate,
    expiryDate: domain.expiryDate,
    renewalDate,
    registrationPeriodMonths,
    nameservers: domain.nameservers,
    dnsRecords: domain.dnsRecords,
    dnsZone: domain.dnsZone,
    sslCertificateStatus: domain.sslCertificateStatus,
    autoRenew: domain.autoRenew,
    whoisStatus: domain.whoisStatus,
    domainStatus: domain.domainStatus,
    effectiveDomainStatus: effectiveStatus,
    dnsRecordCount: Array.isArray(domain.dnsRecords) ? domain.dnsRecords.length : 0,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    history: "history" in domain ? domain.history : undefined,
  };
}
