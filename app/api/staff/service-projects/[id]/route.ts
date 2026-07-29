import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { serializeProjectService } from "@/lib/services/project-services";
import { serializeServiceDomain } from "@/lib/services/service-domains";
import { serializeServiceHosting } from "@/lib/services/service-hosting";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  erpProjectId: z.string().nullable().optional(),
});

function serializeServiceDetail(
  service: NonNullable<
    Awaited<
      ReturnType<
        typeof prisma.project.findFirst<{
          include: {
            services: { include: { serviceDomain: true; serviceHosting: true } };
          };
        }>
      >
    >
  >["services"][number]
) {
  return {
    ...serializeProjectService(service),
    domain: service.serviceDomain ? serializeServiceDomain(service.serviceDomain) : null,
    hosting: service.serviceHosting ? serializeServiceHosting(service.serviceHosting) : null,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "projects.view");
  if (!canView) return apiError("FORBIDDEN", "Missing projects.view permission", 403);

  const { id } = await context.params;

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: { select: { id: true, fullName: true, email: true, company: true } },
      erpProject: {
        select: { id: true, name: true, projectCode: true, status: true },
      },
      services: {
        where: { deletedAt: null },
        include: { serviceDomain: true, serviceHosting: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) return apiError("NOT_FOUND", "Service project not found", 404);

  return apiSuccess({
    id: project.id,
    clientId: project.clientId,
    name: project.name,
    status: project.status,
    erpProjectId: project.erpProjectId,
    client: project.client,
    erpProject: project.erpProject,
    services: project.services.map(serializeServiceDetail),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return apiError("NOT_FOUND", "Service project not found", 404);

  if (parsed.data.erpProjectId) {
    const erpProject = await prisma.erpProject.findUnique({
      where: { id: parsed.data.erpProjectId },
      select: { id: true },
    });
    if (!erpProject) return apiError("NOT_FOUND", "ERP project not found", 404);

    const linked = await prisma.project.findFirst({
      where: {
        erpProjectId: parsed.data.erpProjectId,
        deletedAt: null,
        id: { not: id },
      },
      select: { id: true },
    });
    if (linked) {
      return apiError("CONFLICT", "ERP project is already linked to another service project", 409);
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.erpProjectId !== undefined
        ? { erpProjectId: parsed.data.erpProjectId }
        : {}),
      updatedBy: auth.user.id,
    },
    include: {
      client: { select: { id: true, fullName: true, email: true, company: true } },
      erpProject: {
        select: { id: true, name: true, projectCode: true, status: true },
      },
      services: {
        where: { deletedAt: null },
        include: { serviceDomain: true, serviceHosting: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "service_project.update",
    module: "projects",
    entityType: "Project",
    entityId: project.id,
    summary: `Updated service project ${project.name}`,
  });

  return apiSuccess({
    id: project.id,
    clientId: project.clientId,
    name: project.name,
    status: project.status,
    erpProjectId: project.erpProjectId,
    client: project.client,
    erpProject: project.erpProject,
    services: project.services.map(serializeServiceDetail),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const { id } = await context.params;

  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return apiError("NOT_FOUND", "Service project not found", 404);

  const project = await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: auth.user.id },
    include: {
      client: { select: { id: true, fullName: true, email: true, company: true } },
      erpProject: { select: { id: true, name: true, projectCode: true, status: true } },
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "service_project.soft_delete",
    module: "projects",
    entityType: "Project",
    entityId: project.id,
    summary: `Soft-deleted service project ${project.name}`,
  });

  return apiSuccess({
    id: project.id,
    clientId: project.clientId,
    name: project.name,
    status: project.status,
    deletedAt: project.deletedAt,
  });
}
