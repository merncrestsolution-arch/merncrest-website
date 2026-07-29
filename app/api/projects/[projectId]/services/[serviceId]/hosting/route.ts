import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  createServiceHosting,
  serializeServiceHosting,
} from "@/lib/services/service-hosting";

const createSchema = z.object({
  packageName: z.string().min(1).max(160),
  diskQuotaMb: z.number().int().min(1),
  bandwidthQuotaMb: z.number().int().min(1),
  serverLocation: z.string().max(120).optional().nullable(),
  expiryDate: z.string().datetime(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; serviceId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "hosting.view");
  if (!canView) return apiError("FORBIDDEN", "Missing hosting.view permission", 403);

  const { projectId, serviceId } = await context.params;

  const service = await prisma.projectService.findFirst({
    where: {
      id: serviceId,
      projectId,
      serviceType: "HOSTING",
      deletedAt: null,
    },
  });
  if (!service) {
    return apiError("NOT_FOUND", "Hosting service not found", 404);
  }

  const account = await prisma.serviceHostingAccount.findFirst({
    where: { projectServiceId: serviceId, deletedAt: null },
    include: {
      history: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!account) return apiError("NOT_FOUND", "Hosting account not found for this service", 404);

  return apiSuccess({
    ...serializeServiceHosting(account),
    history: account.history,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string; serviceId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "hosting.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing hosting.manage permission", 403);

  const { projectId, serviceId } = await context.params;

  const service = await prisma.projectService.findFirst({
    where: { id: serviceId, projectId, deletedAt: null },
  });
  if (!service) return apiError("NOT_FOUND", "Service not found", 404);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const result = await createServiceHosting({
    projectServiceId: serviceId,
    packageName: parsed.data.packageName,
    diskQuotaMb: parsed.data.diskQuotaMb,
    bandwidthQuotaMb: parsed.data.bandwidthQuotaMb,
    serverLocation: parsed.data.serverLocation,
    expiryDate: new Date(parsed.data.expiryDate),
    actorId: auth.user.id,
  });

  if ("error" in result) {
    if (result.error === "INVALID_SERVICE") {
      return apiError("INVALID_SERVICE", "Service must be HOSTING type", 400);
    }
    if (result.error === "ALREADY_EXISTS") {
      return apiError("CONFLICT", "Hosting account already exists for this service", 409);
    }
    return apiError("NOT_FOUND", "Service not found", 404);
  }

  return apiSuccess(serializeServiceHosting(result), undefined, 201);
}
