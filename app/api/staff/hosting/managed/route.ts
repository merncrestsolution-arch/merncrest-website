import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeServiceHosting } from "@/lib/services/service-hosting";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

function enrichHosting(
  account: Parameters<typeof serializeServiceHosting>[0] & {
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
  const base = serializeServiceHosting(account);
  return {
    ...base,
    projectService: {
      id: account.projectService.id,
      serviceType: account.projectService.serviceType,
      status: account.projectService.status,
    },
    project: {
      id: account.projectService.project.id,
      name: account.projectService.project.name,
      status: account.projectService.project.status,
      erpProjectId: account.projectService.project.erpProjectId,
    },
    client: account.projectService.project.client,
  };
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "hosting.view");
  if (!canView) return apiError("FORBIDDEN", "Missing hosting.view permission", 403);

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const projectServiceId = searchParams.get("projectServiceId");
  const projectId = searchParams.get("projectId");
  const clientId = searchParams.get("clientId");
  const { page, limit, skip } = parsePagination(searchParams);

  const where = {
    deletedAt: null,
    ...(q ? { packageName: { contains: q, mode: "insensitive" as const } } : {}),
    ...(projectServiceId ? { projectServiceId } : {}),
    ...(projectId || clientId
      ? {
          projectService: {
            deletedAt: null,
            ...(projectId ? { projectId } : {}),
            ...(clientId
              ? {
                  project: {
                    clientId,
                    deletedAt: null,
                  },
                }
              : {}),
          },
        }
      : {}),
  };

  const [accounts, total] = await Promise.all([
    prisma.serviceHostingAccount.findMany({
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
    prisma.serviceHostingAccount.count({ where }),
  ]);

  return apiSuccess(
    accounts.map(enrichHosting),
    paginationMeta(page, total, limit)
  );
}
