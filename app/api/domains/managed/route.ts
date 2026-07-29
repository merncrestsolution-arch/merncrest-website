import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeServiceDomain } from "@/lib/services/service-domains";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

/**
 * Staff paginated list of managed domains (ServiceDomain records).
 * Scoped listing by projectServiceId via query param.
 */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "domains.view");
  if (!canView) return apiError("FORBIDDEN", "Missing domains.view permission", 403);

  const { searchParams } = new URL(request.url);
  const projectServiceId = searchParams.get("projectServiceId");
  const projectId = searchParams.get("projectId");
  const { page, limit, skip } = parsePagination(searchParams);

  const where = {
    deletedAt: null,
    ...(projectServiceId ? { projectServiceId } : {}),
    ...(projectId
      ? {
          projectService: {
            projectId,
            deletedAt: null,
          },
        }
      : {}),
  };

  const [domains, total] = await Promise.all([
    prisma.serviceDomain.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.serviceDomain.count({ where }),
  ]);

  return apiSuccess(
    domains.map(serializeServiceDomain),
    paginationMeta(page, total, limit)
  );
}
