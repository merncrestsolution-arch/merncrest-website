import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  serializeServiceDomain,
  updateDomainNameservers,
} from "@/lib/services/service-domains";

const patchSchema = z.object({
  nameservers: z.array(z.string().min(1)).min(1),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const result = await updateDomainNameservers(id, parsed.data.nameservers, auth.user.id);

  if ("error" in result) {
    if (result.error === "LIFECYCLE_LOCKED") {
      return apiError("FORBIDDEN", "Nameserver changes require purchasedViaMernCrest", 403);
    }
    return apiError("NOT_FOUND", "Domain not found", 404);
  }

  return apiSuccess(serializeServiceDomain(result));
}
