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

function serializeDomain(
  d: {
    id: string;
    name: string;
    tld: string;
    status: string;
    expiresAt: Date | null;
    locked: boolean;
    registrar: string | null;
    registeredAt: Date | null;
    registrationCostCents: number;
    isFreeProvided: boolean;
    freeDurationLabel: string | null;
    renewalPeriodMonths: number | null;
    renewalCostCents: number;
    nameservers: string;
    autoRenew: boolean;
    providerRef: string | null;
    userId: string;
    user: { id: string; fullName: string; email: string; company: string | null };
    provider?: { name: string } | null;
  }
) {
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
    registrationCostCents: d.registrationCostCents,
    isFreeProvided: d.isFreeProvided,
    freeDurationLabel: d.freeDurationLabel,
    renewalPeriodMonths: d.renewalPeriodMonths,
    renewalCostCents: d.renewalCostCents,
    nameservers: d.nameservers.split(",").map((s) => s.trim()).filter(Boolean),
    autoRenew: d.autoRenew,
    locked: d.locked,
    providerRef: d.providerRef,
    client: {
      id: d.user.id,
      name: d.user.company || d.user.fullName,
      email: d.user.email,
    },
  };
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const statusFilter = (searchParams.get("status") || "").trim();
  const clientId = (searchParams.get("clientId") || "").trim();
  const expiringDays = Number(searchParams.get("expiringDays") || "0");
  const expiringOnly = searchParams.get("expiringOnly") === "1";

  const domains = await prisma.domain.findMany({
    where: {
      deletedAt: null,
      ...(clientId ? { userId: clientId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tld: { contains: q, mode: "insensitive" } },
              { registrar: { contains: q, mode: "insensitive" } },
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
    orderBy: { expiresAt: "asc" },
    take: 500,
  });

  let rows = domains.map(serializeDomain);

  if (statusFilter) {
    rows = rows.filter((r) => r.displayStatus.toLowerCase() === statusFilter.toLowerCase());
  }

  if (expiringOnly || expiringDays > 0) {
    const days = expiringDays > 0 ? expiringDays : 30;
    rows = rows.filter((r) => {
      const alert = r.expiryAlert;
      if (expiringOnly) return alert !== "none";
      return alert === "expired" || alert === "30" || alert === "14" || alert === "7";
    });
    if (expiringDays > 0) {
      rows = rows.filter((r) => {
        if (!r.expiresAt) return false;
        const cutoff = Date.now() + days * 86400000;
        return new Date(r.expiresAt).getTime() <= cutoff;
      });
    }
  }

  const alerts = {
    within30: rows.filter((r) => r.expiryAlert === "30" || r.expiryAlert === "14" || r.expiryAlert === "7").length,
    within14: rows.filter((r) => r.expiryAlert === "14" || r.expiryAlert === "7").length,
    within7: rows.filter((r) => r.expiryAlert === "7").length,
    expired: rows.filter((r) => r.expiryAlert === "expired").length,
  };

  return apiSuccess(rows, { total: rows.length, alerts });
}

const createSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(63),
  tld: z.string().min(2).max(32),
  registrar: z.string().max(120).optional(),
  providerId: z.string().optional(),
  registeredAt: z.string().optional(),
  expiresAt: z.string().optional(),
  registrationCostCents: z.number().int().min(0).optional(),
  isFreeProvided: z.boolean().optional(),
  freeDurationLabel: z.string().max(80).optional(),
  renewalPeriodMonths: z.number().int().min(1).optional(),
  renewalCostCents: z.number().int().min(0).optional(),
  nameservers: z.array(z.string()).optional(),
  autoRenew: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const name = parsed.data.name.toLowerCase().trim();
  const tld = parsed.data.tld.toLowerCase().replace(/^\./, "").trim();

  const existing = await prisma.domain.findFirst({
    where: { name, tld, deletedAt: null },
  });
  if (existing) return apiError("CONFLICT", "Domain already exists", 409);

  const domain = await prisma.domain.create({
    data: {
      userId: parsed.data.userId,
      name,
      tld,
      registrar: parsed.data.registrar || null,
      providerId: parsed.data.providerId || null,
      registeredAt: parsed.data.registeredAt ? new Date(parsed.data.registeredAt) : new Date(),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      registrationCostCents: parsed.data.registrationCostCents ?? 0,
      isFreeProvided: parsed.data.isFreeProvided ?? false,
      freeDurationLabel: parsed.data.freeDurationLabel || null,
      renewalPeriodMonths: parsed.data.renewalPeriodMonths ?? null,
      renewalCostCents: parsed.data.renewalCostCents ?? 0,
      nameservers: parsed.data.nameservers?.join(",") ?? "ns1.provider.example,ns2.provider.example",
      autoRenew: parsed.data.autoRenew ?? true,
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
    action: "domain.create",
    module: "domains",
    entityType: "Domain",
    entityId: domain.id,
    summary: `Created domain ${name}.${tld}`,
  });

  return apiSuccess(serializeDomain(domain), undefined, 201);
}
