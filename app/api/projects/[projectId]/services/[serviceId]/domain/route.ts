import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  createServiceDomain,
  serializeServiceDomain,
} from "@/lib/services/service-domains";

const createSchema = z.object({
  domainName: z.string().min(1).max(255),
  registrar: z.string().max(120).optional().nullable(),
  purchasedViaMernCrest: z.boolean().optional(),
  registrationDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  nameservers: z.array(z.string()).optional(),
  dnsRecords: z.unknown().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; serviceId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "domains.view");
  if (!canView) return apiError("FORBIDDEN", "Missing domains.view permission", 403);

  const { projectId, serviceId } = await context.params;

  const service = await prisma.projectService.findFirst({
    where: {
      id: serviceId,
      projectId,
      serviceType: "DOMAIN_REGISTRATION",
      deletedAt: null,
    },
  });
  if (!service) {
    return apiError("NOT_FOUND", "Domain registration service not found", 404);
  }

  const domain = await prisma.serviceDomain.findFirst({
    where: { projectServiceId: serviceId, deletedAt: null },
    include: {
      history: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!domain) return apiError("NOT_FOUND", "Domain not found for this service", 404);

  return apiSuccess(serializeServiceDomain(domain));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string; serviceId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "domains.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing domains.manage permission", 403);

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

  try {
    const result = await createServiceDomain({
      projectServiceId: serviceId,
      domainName: parsed.data.domainName,
      registrar: parsed.data.registrar,
      purchasedViaMernCrest: parsed.data.purchasedViaMernCrest,
      registrationDate: new Date(parsed.data.registrationDate),
      expiryDate: new Date(parsed.data.expiryDate),
      nameservers: parsed.data.nameservers,
      dnsRecords: parsed.data.dnsRecords,
      actorId: auth.user.id,
    });

    if ("error" in result) {
      if (result.error === "INVALID_SERVICE") {
        return apiError("INVALID_SERVICE", "Service must be DOMAIN_REGISTRATION type", 400);
      }
      if (result.error === "ALREADY_EXISTS") {
        return apiError("CONFLICT", "Domain already exists for this service", 409);
      }
      return apiError("NOT_FOUND", "Service not found", 404);
    }

    return apiSuccess(serializeServiceDomain(result), undefined, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create domain";
    return apiError("VALIDATION", message);
  }
}
