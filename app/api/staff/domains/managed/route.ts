import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeServiceDomain } from "@/lib/services/service-domains";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

function enrichDomain(
  domain: Parameters<typeof serializeServiceDomain>[0] & {
    projectService: {
      id: string;
      serviceType: string;
      status: string;
      project: {
        id: string;
        name: string;
        status: string;
        erpProjectId: string | null;
        client: { id: string; fullName: string; email: string; company: string | null };
      };
    };
  }
) {
  const base = serializeServiceDomain(domain);
  return {
    ...base,
    projectService: {
      id: domain.projectService.id,
      serviceType: domain.projectService.serviceType,
      status: domain.projectService.status,
    },
    project: {
      id: domain.projectService.project.id,
      name: domain.projectService.project.name,
      status: domain.projectService.project.status,
      erpProjectId: domain.projectService.project.erpProjectId,
    },
    client: domain.projectService.project.client,
  };
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "domains.view");
  if (!canView) return apiError("FORBIDDEN", "Missing domains.view permission", 403);

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const projectServiceId = searchParams.get("projectServiceId");
  const projectId = searchParams.get("projectId");
  const clientId = searchParams.get("clientId");
  const { page, limit, skip } = parsePagination(searchParams);

  const projectFilter = {
    deletedAt: null,
    ...(clientId ? { clientId } : {}),
  };

  const where = {
    deletedAt: null,
    projectService: {
      deletedAt: null,
      ...(projectServiceId ? { id: projectServiceId } : {}),
      ...(projectId ? { projectId } : {}),
      project: projectFilter,
    },
    ...(q ? { domainName: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [domains, total] = await Promise.all([
    prisma.serviceDomain.findMany({
      where,
      include: {
        projectService: {
          include: {
            project: {
              include: {
                client: {
                  select: { id: true, fullName: true, email: true, company: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.serviceDomain.count({ where }),
  ]);

  return apiSuccess(
    domains.map(enrichDomain),
    paginationMeta(page, total, limit)
  );
}
