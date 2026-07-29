import type { DnsChangeRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { updateDomainDnsRecords } from "@/lib/services/service-domains";
import { DNS_RECORDS_SCHEMA } from "@/shared/service-types";

export function serializeDnsChangeRequest(row: {
  id: string;
  serviceDomainId: string;
  requestedBy: string;
  status: DnsChangeRequestStatus;
  proposedRecords: unknown;
  clientNotes: string | null;
  reviewNotes: string | null;
  reviewedBy: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  serviceDomain?: {
    id: string;
    domainName: string;
    purchasedViaMernCrest: boolean;
    projectService?: {
      project?: { id: string; name: string; erpProjectId: string | null; clientId: string };
    };
  };
  requester?: { id: string; fullName: string; email: string };
  reviewer?: { id: string; fullName: string; email: string } | null;
}) {
  return {
    id: row.id,
    serviceDomainId: row.serviceDomainId,
    domainName: row.serviceDomain?.domainName ?? null,
    purchasedViaMernCrest: row.serviceDomain?.purchasedViaMernCrest ?? false,
    project: row.serviceDomain?.projectService?.project
      ? {
          id: row.serviceDomain.projectService.project.id,
          name: row.serviceDomain.projectService.project.name,
          erpProjectId: row.serviceDomain.projectService.project.erpProjectId,
        }
      : null,
    requestedBy: row.requestedBy,
    requester: row.requester,
    status: row.status,
    proposedRecords: row.proposedRecords,
    clientNotes: row.clientNotes,
    reviewNotes: row.reviewNotes,
    reviewedBy: row.reviewedBy,
    reviewer: row.reviewer,
    appliedAt: row.appliedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const includeRelations = {
  serviceDomain: {
    select: {
      id: true,
      domainName: true,
      purchasedViaMernCrest: true,
      projectService: {
        select: {
          project: {
            select: { id: true, name: true, erpProjectId: true, clientId: true },
          },
        },
      },
    },
  },
  requester: { select: { id: true, fullName: true, email: true } },
  reviewer: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.DnsChangeRequestInclude;

export async function assertClientOwnsDomain(userId: string, serviceDomainId: string) {
  const domain = await prisma.serviceDomain.findFirst({
    where: {
      id: serviceDomainId,
      deletedAt: null,
      projectService: {
        deletedAt: null,
        project: { clientId: userId, deletedAt: null },
      },
    },
  });
  if (!domain) return { error: "NOT_FOUND" as const };
  return { domain };
}

export async function createDnsChangeRequest(input: {
  serviceDomainId: string;
  requestedBy: string;
  proposedRecords: unknown;
  clientNotes?: string | null;
}) {
  const access = await assertClientOwnsDomain(input.requestedBy, input.serviceDomainId);
  if ("error" in access) return access;

  if (!access.domain.purchasedViaMernCrest) {
    return { error: "NOT_MANAGED" as const };
  }

  const pending = await prisma.dnsChangeRequest.findFirst({
    where: {
      serviceDomainId: input.serviceDomainId,
      status: "PENDING",
      deletedAt: null,
    },
  });
  if (pending) return { error: "PENDING_EXISTS" as const };

  const proposedRecords = DNS_RECORDS_SCHEMA.parse(input.proposedRecords);

  const row = await prisma.dnsChangeRequest.create({
    data: {
      serviceDomainId: input.serviceDomainId,
      requestedBy: input.requestedBy,
      proposedRecords,
      clientNotes: input.clientNotes?.trim() || null,
      createdBy: input.requestedBy,
      updatedBy: input.requestedBy,
    },
    include: includeRelations,
  });

  return serializeDnsChangeRequest(row);
}

export async function reviewDnsChangeRequest(
  id: string,
  reviewerId: string,
  action: "approve" | "reject" | "apply",
  reviewNotes?: string | null
) {
  const existing = await prisma.dnsChangeRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      serviceDomain: true,
    },
  });
  if (!existing) return { error: "NOT_FOUND" as const };

  if (action === "reject") {
    const row = await prisma.dnsChangeRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewNotes: reviewNotes?.trim() || null,
        reviewedBy: reviewerId,
        updatedBy: reviewerId,
      },
      include: includeRelations,
    });
    return serializeDnsChangeRequest(row);
  }

  if (action === "approve") {
    if (existing.status !== "PENDING") return { error: "INVALID_STATUS" as const };
    const row = await prisma.dnsChangeRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewNotes: reviewNotes?.trim() || null,
        reviewedBy: reviewerId,
        updatedBy: reviewerId,
      },
      include: includeRelations,
    });
    return serializeDnsChangeRequest(row);
  }

  if (existing.status !== "PENDING" && existing.status !== "APPROVED") {
    return { error: "INVALID_STATUS" as const };
  }

  const result = await updateDomainDnsRecords(
    existing.serviceDomainId,
    existing.proposedRecords,
    reviewerId,
    "DNS_RECORD_UPDATED"
  );
  if ("error" in result) return result;

  const row = await prisma.dnsChangeRequest.update({
    where: { id },
    data: {
      status: "APPLIED",
      reviewNotes: reviewNotes?.trim() || existing.reviewNotes,
      reviewedBy: reviewerId,
      appliedAt: new Date(),
      updatedBy: reviewerId,
    },
    include: includeRelations,
  });

  return serializeDnsChangeRequest(row);
}
