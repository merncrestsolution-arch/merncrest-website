import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { computeSslDisplayStatus } from "@/lib/domains/status";
import { maskCredential } from "@/lib/security/credentials";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { encryptCredential } from "@/lib/security/credentials";

function parseLinkedDomains(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeHostingList(a: {
  id: string;
  label: string;
  planCode: string;
  status: string;
  primaryDomain: string | null;
  linkedDomainsJson: string | null;
  sslStatus: string;
  sslExpiresAt: Date | null;
  renewsAt: Date | null;
  panelUrl: string | null;
  serverIp: string | null;
  serverLocation: string | null;
  accountId: string | null;
  providerRef: string | null;
  user: { id: string; fullName: string; email: string; company: string | null };
  provider?: { name: string } | null;
  panelUsernameEncrypted: string | null;
  panelPasswordEncrypted: string | null;
  databaseName: string | null;
  databaseUsernameEncrypted: string | null;
  databasePasswordEncrypted: string | null;
}) {
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
    panelUrl: a.panelUrl,
    serverIp: a.serverIp,
    serverLocation: a.serverLocation,
    accountId: a.accountId || a.providerRef,
    provider: a.provider?.name || null,
    linkedDomains: linked,
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

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const clientId = (searchParams.get("clientId") || "").trim();
  const provider = (searchParams.get("provider") || "").trim();
  const expiringOnly = searchParams.get("expiringOnly") === "1";
  const sslIssues = searchParams.get("sslIssues") === "1";

  const accounts = await prisma.hostingAccount.findMany({
    where: {
      deletedAt: null,
      ...(clientId ? { userId: clientId } : {}),
      ...(provider
        ? { provider: { name: { contains: provider, mode: "insensitive" } } }
        : {}),
      ...(q
        ? {
            OR: [
              { label: { contains: q, mode: "insensitive" } },
              { planCode: { contains: q, mode: "insensitive" } },
              { primaryDomain: { contains: q, mode: "insensitive" } },
              { serverIp: { contains: q } },
              { user: { fullName: { contains: q, mode: "insensitive" } } },
              { user: { company: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, company: true } },
      provider: { select: { name: true } },
    },
    orderBy: { renewsAt: "asc" },
    take: 500,
  });

  let rows = accounts.map(serializeHostingList);

  if (expiringOnly) {
    const cutoff = Date.now() + 30 * 86400000;
    rows = rows.filter((r) => r.renewsAt && new Date(r.renewsAt).getTime() <= cutoff);
  }

  if (sslIssues) {
    rows = rows.filter((r) =>
      ["Expiring Soon", "Expired", "Not Configured"].includes(r.sslStatus)
    );
  }

  return apiSuccess(rows, {
    total: rows.length,
    sslIssues: rows.filter((r) => r.sslStatus !== "Active").length,
  });
}

const createSchema = z.object({
  userId: z.string(),
  label: z.string().min(1).max(160),
  planCode: z.string().min(1).max(80),
  providerId: z.string().optional(),
  accountId: z.string().max(120).optional(),
  primaryDomain: z.string().max(255).optional(),
  linkedDomains: z.array(z.string()).optional(),
  panelUrl: z.string().url().optional().or(z.literal("")),
  panelUsername: z.string().max(160).optional(),
  panelPassword: z.string().max(256).optional(),
  databaseName: z.string().max(120).optional(),
  databaseUsername: z.string().max(160).optional(),
  databasePassword: z.string().max(256).optional(),
  serverIp: z.string().max(64).optional(),
  serverSpecs: z.string().max(2000).optional(),
  serverLocation: z.string().max(120).optional(),
  sslStatus: z.string().max(32).optional(),
  sslExpiresAt: z.string().optional().nullable(),
  renewalPeriodMonths: z.number().int().min(1).optional(),
  renewalCostCents: z.number().int().min(0).optional(),
  renewsAt: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "hosting.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing hosting.manage permission", 403);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const account = await prisma.hostingAccount.create({
    data: {
      userId: parsed.data.userId,
      label: parsed.data.label,
      planCode: parsed.data.planCode,
      providerId: parsed.data.providerId || null,
      accountId: parsed.data.accountId || null,
      primaryDomain: parsed.data.primaryDomain || null,
      linkedDomainsJson: parsed.data.linkedDomains
        ? JSON.stringify(parsed.data.linkedDomains)
        : null,
      panelUrl: parsed.data.panelUrl || null,
      panelUsernameEncrypted: encryptCredential(parsed.data.panelUsername),
      panelPasswordEncrypted: encryptCredential(parsed.data.panelPassword),
      databaseName: parsed.data.databaseName || null,
      databaseUsernameEncrypted: encryptCredential(parsed.data.databaseUsername),
      databasePasswordEncrypted: encryptCredential(parsed.data.databasePassword),
      serverIp: parsed.data.serverIp || null,
      serverSpecs: parsed.data.serverSpecs || null,
      serverLocation: parsed.data.serverLocation || null,
      sslStatus: parsed.data.sslStatus || "PENDING",
      sslExpiresAt: parsed.data.sslExpiresAt ? new Date(parsed.data.sslExpiresAt) : null,
      renewalPeriodMonths: parsed.data.renewalPeriodMonths ?? null,
      renewalCostCents: parsed.data.renewalCostCents ?? 0,
      renewsAt: parsed.data.renewsAt ? new Date(parsed.data.renewsAt) : null,
      status: "ACTIVE",
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, company: true } },
      provider: { select: { name: true } },
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "hosting.create",
    module: "hosting",
    entityType: "HostingAccount",
    entityId: account.id,
    summary: `Created hosting account ${account.label}`,
  });

  return apiSuccess(serializeHostingList(account), undefined, 201);
}
