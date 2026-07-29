import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { rateLimit, clientIp } from "@/lib/chat/rate-limit";

const dnsSchema = z.object({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]),
  host: z.string().min(0).max(255),
  value: z.string().min(1).max(512),
  ttl: z.number().int().min(60).max(86400).optional(),
  priority: z.number().int().min(0).max(65535).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const rl = rateLimit({
    key: `dns:change:${auth.user.id}:${clientIp(request)}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return apiError("RATE_LIMIT", "Too many DNS change requests.", 429);
  }

  const { id } = await context.params;
  const domain = await prisma.domain.findFirst({ where: { id, deletedAt: null } });
  if (!domain) return apiError("NOT_FOUND", "Domain not found", 404);

  const body = await request.json();
  const parsed = dnsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid DNS record");
  }

  const record = await prisma.dnsRecord.create({
    data: {
      domainId: id,
      type: parsed.data.type,
      host: parsed.data.host,
      value: parsed.data.value,
      ttl: parsed.data.ttl ?? 3600,
      priority: parsed.data.priority ?? null,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "domain.dns.create",
    module: "domains",
    entityType: "DnsRecord",
    entityId: record.id,
    summary: `Added DNS ${parsed.data.type} for ${domain.name}.${domain.tld}`,
  });

  return apiSuccess(record, undefined, 201);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const { id } = await context.params;
  const recordId = new URL(request.url).searchParams.get("recordId");
  if (!recordId) return apiError("VALIDATION", "recordId required");

  const record = await prisma.dnsRecord.findFirst({
    where: { id: recordId, domainId: id, deletedAt: null },
    include: { domain: true },
  });
  if (!record) return apiError("NOT_FOUND", "DNS record not found", 404);

  await prisma.dnsRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date(), updatedBy: auth.user.id },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "domain.dns.delete",
    module: "domains",
    entityType: "DnsRecord",
    entityId: recordId,
    summary: `Removed DNS ${record.type} for ${record.domain.name}.${record.domain.tld}`,
  });

  return apiSuccess({ id: recordId });
}
