import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { lookupLiveDns } from "@/lib/dns/live-dns-lookup";
import { syncLiveDnsForDomain } from "@/lib/dns/sync-domain-live";
import { prisma } from "@/lib/db";
import { serializeServiceDomain } from "@/lib/services/service-domains";
import type { DnsRecord } from "@/shared/service-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "domains.view");
  if (!canView) return apiError("FORBIDDEN", "Missing domains.view permission", 403);

  const { id } = await context.params;
  const domain = await prisma.serviceDomain.findFirst({
    where: { id, deletedAt: null },
  });
  if (!domain) return apiError("NOT_FOUND", "Domain not found", 404);

  const live = await lookupLiveDns(domain.domainName);

  return apiSuccess({
    live,
    stored: {
      nameservers: domain.nameservers,
      dnsRecords: domain.dnsRecords as DnsRecord[] | null,
      dnsZone: domain.dnsZone,
    },
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const { id } = await context.params;
  const result = await syncLiveDnsForDomain(id, auth.user.id);
  if (!result) return apiError("NOT_FOUND", "Domain not found", 404);

  return apiSuccess({
    domain: serializeServiceDomain(result.domain),
    live: result.live,
  });
}
