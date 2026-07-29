import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import {
  createProjectService,
  serializeProjectService,
} from "@/lib/services/project-services";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

const createSchema = z.object({
  serviceType: z.enum([
    "DOMAIN_REGISTRATION",
    "HOSTING",
    "SECURITY",
    "SSL_CERTIFICATE",
    "CLOUD_SERVICE",
    "EMAIL_HOSTING",
    "MAINTENANCE",
    "BACKUP",
    "OTHER",
  ]),
  startDate: z.string().datetime(),
  freePeriodDays: z.number().int().min(0).optional().nullable(),
  billingCycle: z
    .enum(["MONTHLY", "QUARTERLY", "ANNUAL", "ONE_TIME"])
    .optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  metadata: z.unknown().optional(),
  reminderScheduleDays: z.array(z.number().int().min(0)).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "projects.view");
  if (!canView) return apiError("FORBIDDEN", "Missing projects.view permission", 403);

  const { projectId } = await context.params;
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) return apiError("NOT_FOUND", "Project not found", 404);

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);

  const where = { projectId, deletedAt: null };
  const [services, total] = await Promise.all([
    prisma.projectService.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.projectService.count({ where }),
  ]);

  return apiSuccess(
    services.map(serializeProjectService),
    paginationMeta(page, total, limit)
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const { projectId } = await context.params;
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await createProjectService({
      projectId,
      serviceType: parsed.data.serviceType,
      startDate: new Date(parsed.data.startDate),
      freePeriodDays: parsed.data.freePeriodDays,
      billingCycle: parsed.data.billingCycle,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      metadata: parsed.data.metadata,
      reminderScheduleDays: parsed.data.reminderScheduleDays,
      actorId: auth.user.id,
    });

    if ("error" in result) {
      return apiError("NOT_FOUND", "Project not found", 404);
    }

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "project_service.create",
      module: "projects",
      entityType: "ProjectService",
      entityId: result.id,
      summary: `Attached ${parsed.data.serviceType} service to project`,
    });

    return apiSuccess(serializeProjectService(result), undefined, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create service";
    return apiError("VALIDATION", message);
  }
}
