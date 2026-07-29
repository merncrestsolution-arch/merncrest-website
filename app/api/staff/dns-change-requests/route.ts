import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeDnsChangeRequest } from "@/lib/dns/dns-change-requests";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "domains.view");
  if (!canView) return apiError("FORBIDDEN", "Missing domains.view permission", 403);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const { page, limit, skip } = parsePagination(searchParams);

  const where = {
    deletedAt: null,
    ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "APPLIED" } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.dnsChangeRequest.findMany({
      where,
      include: {
        serviceDomain: {
          select: {
            id: true,
            domainName: true,
            purchasedViaMernCrest: true,
            projectService: {
              select: {
                project: {
                  select: { id: true, name: true, erpProjectId: true, clientId: true },
                },
              },
            },
          },
        },
        requester: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.dnsChangeRequest.count({ where }),
  ]);

  return apiSuccess(
    rows.map(serializeDnsChangeRequest),
    paginationMeta(page, total, limit)
  );
}
