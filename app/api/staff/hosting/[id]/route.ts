import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { computeSslDisplayStatus } from "@/lib/domains/status";
import { encryptCredential, maskCredential } from "@/lib/security/credentials";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";

function parseLinkedDomains(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeDetail(a: NonNullable<Awaited<ReturnType<typeof loadAccount>>>) {
  const linked = parseLinkedDomains(a.linkedDomainsJson);
  if (a.primaryDomain && !linked.includes(a.primaryDomain)) linked.unshift(a.primaryDomain);

  return {
    id: a.id,
    label: a.label,
    planCode: a.planCode,
    status: a.status,
    sslStatus: computeSslDisplayStatus(a.sslStatus, a.sslExpiresAt),
    sslExpiresAt: a.sslExpiresAt,
    renewsAt: a.renewsAt,
    activatedAt: a.activatedAt,
    panelUrl: a.panelUrl,
    serverIp: a.serverIp,
    serverSpecs: a.serverSpecs,
    serverLocation: a.serverLocation,
    accountId: a.accountId || a.providerRef,
    providerId: a.providerId,
    provider: a.provider?.name || null,
    renewalPeriodMonths: a.renewalPeriodMonths,
    renewalCostCents: a.renewalCostCents,
    linkedDomains: linked,
    diskMb: a.diskMb,
    diskUsedMb: a.diskUsedMb,
    bandwidthGb: a.bandwidthGb,
    bandwidthUsedGb: a.bandwidthUsedGb,
    cpuPercent: a.cpuPercent,
    ramMb: a.ramMb,
    ramUsedMb: a.ramUsedMb,
    backupStatus: a.backupStatus,
    client: {
      id: a.user.id,
      name: a.user.company || a.user.fullName,
      email: a.user.email,
    },
    credentials: {
      hasPanelUsername: Boolean(a.panelUsernameEncrypted),
      hasPanelPassword: Boolean(a.panelPasswordEncrypted),
      hasDatabaseUsername: Boolean(a.databaseUsernameEncrypted),
      hasDatabasePassword: Boolean(a.databasePasswordEncrypted),
      panelUsernameMasked: maskCredential(a.panelUsernameEncrypted),
      panelPasswordMasked: maskCredential(a.panelPasswordEncrypted),
      databaseName: a.databaseName,
      databaseUsernameMasked: maskCredential(a.databaseUsernameEncrypted),
      databasePasswordMasked: maskCredential(a.databasePasswordEncrypted),
    },
  };
}

async function loadAccount(id: string) {
  return prisma.hostingAccount.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { id: true, fullName: true, email: true, company: true } },
      provider: { select: { id: true, name: true } },
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
  const account = await loadAccount(id);
  if (!account) return apiError("NOT_FOUND", "Hosting account not found", 404);

  return apiSuccess(serializeDetail(account));
}

const patchSchema = z.object({
  label: z.string().min(1).max(160).optional(),
  planCode: z.string().min(1).max(80).optional(),
  status: z.string().max(32).optional(),
  primaryDomain: z.string().max(255).optional().nullable(),
  linkedDomains: z.array(z.string()).optional(),
  panelUrl: z.string().url().optional().nullable().or(z.literal("")),
  panelUsername: z.string().max(160).optional(),
  panelPassword: z.string().max(256).optional(),
  databaseName: z.string().max(120).optional().nullable(),
  databaseUsername: z.string().max(160).optional(),
  databasePassword: z.string().max(256).optional(),
  serverIp: z.string().max(64).optional().nullable(),
  serverSpecs: z.string().max(2000).optional().nullable(),
  serverLocation: z.string().max(120).optional().nullable(),
  sslStatus: z.string().max(32).optional(),
  sslExpiresAt: z.string().optional().nullable(),
  renewalPeriodMonths: z.number().int().min(1).optional().nullable(),
  renewalCostCents: z.number().int().min(0).optional(),
  renewsAt: z.string().optional().nullable(),
  accountId: z.string().max(120).optional().nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "hosting.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing hosting.manage permission", 403);

  const { id } = await context.params;
  const existing = await loadAccount(id);
  if (!existing) return apiError("NOT_FOUND", "Hosting account not found", 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data: Record<string, unknown> = { updatedBy: auth.user.id };
  if (parsed.data.label) data.label = parsed.data.label;
  if (parsed.data.planCode) data.planCode = parsed.data.planCode;
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.primaryDomain !== undefined) data.primaryDomain = parsed.data.primaryDomain;
  if (parsed.data.linkedDomains) data.linkedDomainsJson = JSON.stringify(parsed.data.linkedDomains);
  if (parsed.data.panelUrl !== undefined) data.panelUrl = parsed.data.panelUrl || null;
  if (parsed.data.panelUsername) data.panelUsernameEncrypted = encryptCredential(parsed.data.panelUsername);
  if (parsed.data.panelPassword) data.panelPasswordEncrypted = encryptCredential(parsed.data.panelPassword);
  if (parsed.data.databaseName !== undefined) data.databaseName = parsed.data.databaseName;
  if (parsed.data.databaseUsername) {
    data.databaseUsernameEncrypted = encryptCredential(parsed.data.databaseUsername);
  }
  if (parsed.data.databasePassword) {
    data.databasePasswordEncrypted = encryptCredential(parsed.data.databasePassword);
  }
  if (parsed.data.serverIp !== undefined) data.serverIp = parsed.data.serverIp;
  if (parsed.data.serverSpecs !== undefined) data.serverSpecs = parsed.data.serverSpecs;
  if (parsed.data.serverLocation !== undefined) data.serverLocation = parsed.data.serverLocation;
  if (parsed.data.sslStatus) data.sslStatus = parsed.data.sslStatus;
  if (parsed.data.sslExpiresAt !== undefined) {
    data.sslExpiresAt = parsed.data.sslExpiresAt ? new Date(parsed.data.sslExpiresAt) : null;
  }
  if (parsed.data.renewalPeriodMonths !== undefined) {
    data.renewalPeriodMonths = parsed.data.renewalPeriodMonths;
  }
  if (parsed.data.renewalCostCents !== undefined) {
    data.renewalCostCents = parsed.data.renewalCostCents;
  }
  if (parsed.data.renewsAt !== undefined) {
    data.renewsAt = parsed.data.renewsAt ? new Date(parsed.data.renewsAt) : null;
  }
  if (parsed.data.accountId !== undefined) data.accountId = parsed.data.accountId;

  await prisma.hostingAccount.update({ where: { id }, data });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "hosting.update",
    module: "hosting",
    entityType: "HostingAccount",
    entityId: id,
    summary: `Updated hosting account ${existing.label}`,
  });

  const account = await loadAccount(id);
  return apiSuccess(serializeDetail(account!));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "hosting.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing hosting.manage permission", 403);

  const { id } = await context.params;
  const existing = await loadAccount(id);
  if (!existing) return apiError("NOT_FOUND", "Hosting account not found", 404);

  await prisma.hostingAccount.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: auth.user.id },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "hosting.soft_delete",
    module: "hosting",
    entityType: "HostingAccount",
    entityId: id,
    summary: `Soft-deleted hosting account ${existing.label}`,
  });

  return apiSuccess({ id });
}
