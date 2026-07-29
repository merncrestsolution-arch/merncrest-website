import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeServiceDomain } from "@/lib/services/service-domains";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "domains.view");
  if (!canView) return apiError("FORBIDDEN", "Missing domains.view permission", 403);

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const { page, limit, skip } = parsePagination(searchParams);

  const domains = await prisma.serviceDomain.findMany({
    where: {
      deletedAt: null,
      ...(q ? { domainName: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      projectService: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              erpProjectId: true,
              client: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { domainName: "asc" },
    skip,
    take: limit,
  });

  const total = await prisma.serviceDomain.count({
    where: {
      deletedAt: null,
      ...(q ? { domainName: { contains: q, mode: "insensitive" } } : {}),
    },
  });

  const rows = domains.map((d) => ({
    ...serializeServiceDomain(d),
    project: d.projectService.project
      ? {
          id: d.projectService.project.id,
          name: d.projectService.project.name,
          erpProjectId: d.projectService.project.erpProjectId,
        }
      : null,
    client: d.projectService.project?.client ?? null,
  }));

  return apiSuccess(rows, paginationMeta(page, total, limit));
}
