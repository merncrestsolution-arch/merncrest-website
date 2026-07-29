import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  serializeServiceDomain,
  updateDomainDnsRecords,
} from "@/lib/services/service-domains";
import { DNS_RECORDS_SCHEMA } from "@/shared/service-types";

const putSchema = z.object({
  records: DNS_RECORDS_SCHEMA,
  action: z.enum(["DNS_RECORD_ADDED", "DNS_RECORD_UPDATED", "DNS_RECORD_REMOVED"]).optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await updateDomainDnsRecords(
      id,
      parsed.data.records,
      auth.user.id,
      parsed.data.action ?? "DNS_RECORD_UPDATED"
    );

    if ("error" in result) {
      if (result.error === "LIFECYCLE_LOCKED") {
        return apiError("FORBIDDEN", "DNS changes require purchasedViaMernCrest", 403);
      }
      return apiError("NOT_FOUND", "Domain not found", 404);
    }

    return apiSuccess(serializeServiceDomain(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid DNS records";
    return apiError("VALIDATION", message);
  }
}
