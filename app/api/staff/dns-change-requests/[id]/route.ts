import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { reviewDnsChangeRequest } from "@/lib/dns/dns-change-requests";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "apply"]),
  reviewNotes: z.string().max(4000).optional(),
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
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const result = await reviewDnsChangeRequest(
    id,
    auth.user.id,
    parsed.data.action,
    parsed.data.reviewNotes
  );

  if ("error" in result) {
    if (result.error === "NOT_FOUND") return apiError("NOT_FOUND", "Request not found", 404);
    if (result.error === "INVALID_STATUS") {
      return apiError("CONFLICT", "Request cannot be processed in its current status", 409);
    }
    if (result.error === "LIFECYCLE_LOCKED") {
      return apiError("FORBIDDEN", "Domain is not managed by MernCrest", 403);
    }
    return apiError("VALIDATION", "Failed to apply DNS changes");
  }

  return apiSuccess(result);
}
