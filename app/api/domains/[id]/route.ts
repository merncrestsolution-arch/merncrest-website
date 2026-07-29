import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  renewServiceDomain,
  serializeServiceDomain,
  softDeleteServiceDomain,
  updateServiceDomain,
} from "@/lib/services/service-domains";

const patchSchema = z.object({
  registrar: z.string().max(120).optional().nullable(),
  registrationDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  domainStatus: z
    .enum(["ACTIVE", "EXPIRING_SOON", "EXPIRED", "TRANSFERRED", "SUSPENDED"])
    .optional(),
  renew: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "domains.view");
  if (!canView) return apiError("FORBIDDEN", "Missing domains.view permission", 403);

  const { id } = await context.params;
  const domain = await prisma.serviceDomain.findFirst({
    where: { id, deletedAt: null },
    include: {
      history: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!domain) return apiError("NOT_FOUND", "Domain not found", 404);

  return apiSuccess(serializeServiceDomain(domain));
}

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

  if (parsed.data.renew && parsed.data.expiryDate) {
    const result = await renewServiceDomain(id, new Date(parsed.data.expiryDate), auth.user.id);
    if ("error" in result) {
      if (result.error === "LIFECYCLE_LOCKED") {
        return apiError("FORBIDDEN", "Lifecycle actions require purchasedViaMernCrest", 403);
      }
      return apiError("NOT_FOUND", "Domain not found", 404);
    }
    return apiSuccess(serializeServiceDomain(result));
  }

  try {
    const result = await updateServiceDomain(
      id,
      {
        registrar: parsed.data.registrar,
        registrationDate: parsed.data.registrationDate
          ? new Date(parsed.data.registrationDate)
          : undefined,
        expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
        domainStatus: parsed.data.domainStatus,
        actorId: auth.user.id,
      },
      { fullLifecycle: true }
    );

    if ("error" in result) {
      if (result.error === "LIFECYCLE_LOCKED") {
        return apiError("FORBIDDEN", "Lifecycle actions require purchasedViaMernCrest", 403);
      }
      return apiError("NOT_FOUND", "Domain not found", 404);
    }

    return apiSuccess(serializeServiceDomain(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update domain";
    return apiError("VALIDATION", message);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

  const { id } = await context.params;
  const result = await softDeleteServiceDomain(id, auth.user.id);

  if ("error" in result) {
    return apiError("NOT_FOUND", "Domain not found", 404);
  }

  return apiSuccess(result);
}
