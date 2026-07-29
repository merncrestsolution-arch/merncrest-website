import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import {
  serializeProjectService,
  softDeleteProjectService,
  updateProjectService,
} from "@/lib/services/project-services";

const patchSchema = z.object({
  status: z
    .enum(["ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED", "PENDING_RENEWAL"])
    .optional(),
  startDate: z.string().datetime().optional(),
  freePeriodDays: z.number().int().min(0).optional().nullable(),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"]).optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  metadata: z.unknown().optional(),
  reminderScheduleDays: z.array(z.number().int().min(0)).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string; serviceId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const { projectId, serviceId } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await updateProjectService(serviceId, projectId, {
      status: parsed.data.status,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      freePeriodDays: parsed.data.freePeriodDays,
      billingCycle: parsed.data.billingCycle,
      expiryDate:
        parsed.data.expiryDate !== undefined
          ? parsed.data.expiryDate
            ? new Date(parsed.data.expiryDate)
            : null
          : undefined,
      metadata: parsed.data.metadata,
      reminderScheduleDays: parsed.data.reminderScheduleDays,
      actorId: auth.user.id,
    });

    if ("error" in result) {
      return apiError("NOT_FOUND", "Service not found", 404);
    }

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "project_service.update",
      module: "projects",
      entityType: "ProjectService",
      entityId: serviceId,
      summary: `Updated project service ${serviceId}`,
    });

    return apiSuccess(serializeProjectService(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update service";
    return apiError("VALIDATION", message);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string; serviceId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const { projectId, serviceId } = await context.params;
  const result = await softDeleteProjectService(serviceId, projectId, auth.user.id);

  if ("error" in result) {
    return apiError("NOT_FOUND", "Service not found", 404);
  }

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project_service.soft_delete",
    module: "projects",
    entityType: "ProjectService",
    entityId: serviceId,
    summary: `Soft-deleted project service ${serviceId}`,
  });

  return apiSuccess(serializeProjectService(result));
}
