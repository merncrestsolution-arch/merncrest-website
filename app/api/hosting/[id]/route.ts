import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  renewServiceHosting,
  serializeServiceHosting,
  softDeleteServiceHosting,
  updateServiceHosting,
} from "@/lib/services/service-hosting";

const patchSchema = z.object({
  packageName: z.string().min(1).max(160).optional(),
  diskQuotaMb: z.number().int().min(1).optional(),
  bandwidthQuotaMb: z.number().int().min(1).optional(),
  diskUsedMb: z.number().int().min(0).optional(),
  bandwidthUsedMb: z.number().int().min(0).optional(),
  serverLocation: z.string().max(120).optional().nullable(),
  hostingStatus: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"]).optional(),
  expiryDate: z.string().datetime().optional(),
  renew: z.boolean().optional(),
});

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
    include: {
      history: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!account) return apiError("NOT_FOUND", "Hosting account not found", 404);

  return apiSuccess({
    ...serializeServiceHosting(account),
    history: account.history,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "hosting.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing hosting.manage permission", 403);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  if (parsed.data.renew) {
    const result = await renewServiceHosting(
      id,
      auth.user.id,
      parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined
    );
    if ("error" in result) {
      return apiError("NOT_FOUND", "Hosting account not found", 404);
    }
    return apiSuccess(serializeServiceHosting(result));
  }

  const result = await updateServiceHosting(id, {
    packageName: parsed.data.packageName,
    diskQuotaMb: parsed.data.diskQuotaMb,
    bandwidthQuotaMb: parsed.data.bandwidthQuotaMb,
    diskUsedMb: parsed.data.diskUsedMb,
    bandwidthUsedMb: parsed.data.bandwidthUsedMb,
    serverLocation: parsed.data.serverLocation,
    hostingStatus: parsed.data.hostingStatus,
    expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
    actorId: auth.user.id,
  });

  if ("error" in result) {
    return apiError("NOT_FOUND", "Hosting account not found", 404);
  }

  return apiSuccess(serializeServiceHosting(result));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "hosting.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing hosting.manage permission", 403);

  const { id } = await context.params;
  const result = await softDeleteServiceHosting(id, auth.user.id);

  if ("error" in result) {
    return apiError("NOT_FOUND", "Hosting account not found", 404);
  }

  return apiSuccess(result);
}
