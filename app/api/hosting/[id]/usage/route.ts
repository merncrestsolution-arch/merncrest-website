import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { serializeHostingUsage } from "@/lib/services/service-hosting";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "hosting.view");
  if (!canView) return apiError("FORBIDDEN", "Missing hosting.view permission", 403);

  const { id } = await context.params;
  const account = await prisma.serviceHostingAccount.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      diskQuotaMb: true,
      diskUsedMb: true,
      bandwidthQuotaMb: true,
      bandwidthUsedMb: true,
    },
  });

  if (!account) return apiError("NOT_FOUND", "Hosting account not found", 404);

  return apiSuccess({
    id: account.id,
    ...serializeHostingUsage(account),
  });
}
