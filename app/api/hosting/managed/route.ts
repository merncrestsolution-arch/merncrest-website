import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeServiceHosting } from "@/lib/services/service-hosting";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "hosting.view");
  if (!canView) return apiError("FORBIDDEN", "Missing hosting.view permission", 403);

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

  const [accounts, total] = await Promise.all([
    prisma.serviceHostingAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.serviceHostingAccount.count({ where }),
  ]);

  return apiSuccess(
    accounts.map(serializeServiceHosting),
    paginationMeta(page, total, limit)
  );
}
