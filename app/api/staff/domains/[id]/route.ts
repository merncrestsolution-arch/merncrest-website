import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import {
  computeDomainDisplayStatus,
  domainExpiryAlertLevel,
} from "@/lib/domains/status";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";

function serializeDomainDetail(
  d: Awaited<ReturnType<typeof loadDomain>>
) {
  if (!d) return null;
  return {
    id: d.id,
    fqdn: `${d.name}.${d.tld}`,
    name: d.name,
    tld: d.tld,
    status: d.status,
    displayStatus: computeDomainDisplayStatus(d),
    expiryAlert: domainExpiryAlertLevel(d.expiresAt),
    expiresAt: d.expiresAt,
    registeredAt: d.registeredAt,
    registrar: d.registrar || d.provider?.name || null,
    providerId: d.providerId,
    providerRef: d.providerRef,
    registrationCostCents: d.registrationCostCents,
    isFreeProvided: d.isFreeProvided,
    freeDurationLabel: d.freeDurationLabel,
    renewalPeriodMonths: d.renewalPeriodMonths,
    renewalCostCents: d.renewalCostCents,
    nameservers: d.nameservers.split(",").map((s) => s.trim()).filter(Boolean),
    autoRenew: d.autoRenew,
    locked: d.locked,
    client: {
      id: d.user.id,
      name: d.user.company || d.user.fullName,
      email: d.user.email,
    },
    dnsRecords: d.dnsRecords.map((r) => ({
      id: r.id,
      type: r.type,
      host: r.host,
      value: r.value,
      ttl: r.ttl,
      priority: r.priority,
    })),
  };
}

async function loadDomain(id: string) {
  return prisma.domain.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { id: true, fullName: true, email: true, company: true } },
      provider: { select: { id: true, name: true } },
      dnsRecords: {
        where: { deletedAt: null },
        orderBy: [{ type: "asc" }, { host: "asc" }],
      },
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const domain = await loadDomain(id);
  if (!domain) return apiError("NOT_FOUND", "Domain not found", 404);

  return apiSuccess(serializeDomainDetail(domain));
}

const patchSchema = z.object({
  registrar: z.string().max(120).optional().nullable(),
  registeredAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  registrationCostCents: z.number().int().min(0).optional(),
  isFreeProvided: z.boolean().optional(),
  freeDurationLabel: z.string().max(80).optional().nullable(),
  renewalPeriodMonths: z.number().int().min(1).optional().nullable(),
  renewalCostCents: z.number().int().min(0).optional(),
  nameservers: z.array(z.string()).optional(),
  autoRenew: z.boolean().optional(),
  locked: z.boolean().optional(),
  status: z.string().max(32).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const { id } = await context.params;
  const existing = await prisma.domain.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return apiError("NOT_FOUND", "Domain not found", 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data: Record<string, unknown> = { updatedBy: auth.user.id };
  if (parsed.data.registrar !== undefined) data.registrar = parsed.data.registrar;
  if (parsed.data.registeredAt !== undefined) {
    data.registeredAt = parsed.data.registeredAt ? new Date(parsed.data.registeredAt) : null;
  }
  if (parsed.data.expiresAt !== undefined) {
    data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  }
  if (parsed.data.registrationCostCents !== undefined) {
    data.registrationCostCents = parsed.data.registrationCostCents;
  }
  if (parsed.data.isFreeProvided !== undefined) data.isFreeProvided = parsed.data.isFreeProvided;
  if (parsed.data.freeDurationLabel !== undefined) {
    data.freeDurationLabel = parsed.data.freeDurationLabel;
  }
  if (parsed.data.renewalPeriodMonths !== undefined) {
    data.renewalPeriodMonths = parsed.data.renewalPeriodMonths;
  }
  if (parsed.data.renewalCostCents !== undefined) {
    data.renewalCostCents = parsed.data.renewalCostCents;
  }
  if (parsed.data.nameservers) data.nameservers = parsed.data.nameservers.join(",");
  if (parsed.data.autoRenew !== undefined) data.autoRenew = parsed.data.autoRenew;
  if (parsed.data.locked !== undefined) data.locked = parsed.data.locked;
  if (parsed.data.status) data.status = parsed.data.status;

  await prisma.domain.update({ where: { id }, data });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "domain.update",
    module: "domains",
    entityType: "Domain",
    entityId: id,
    summary: `Updated domain ${existing.name}.${existing.tld}`,
  });

  const domain = await loadDomain(id);
  return apiSuccess(serializeDomainDetail(domain));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const { id } = await context.params;
  const existing = await prisma.domain.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return apiError("NOT_FOUND", "Domain not found", 404);

  await prisma.domain.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: auth.user.id },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "domain.soft_delete",
    module: "domains",
    entityType: "Domain",
    entityId: id,
    summary: `Soft-deleted domain ${existing.name}.${existing.tld}`,
  });

  return apiSuccess({ id });
}
