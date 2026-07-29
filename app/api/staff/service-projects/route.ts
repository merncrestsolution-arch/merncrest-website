import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";
import { getAssignedClientIds, isSalesAgent } from "@/lib/sales/scope";

const createSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(200),
  erpProjectId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
});

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "projects.view");
  if (!canView) return apiError("FORBIDDEN", "Missing projects.view permission", 403);

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const erpProjectId = searchParams.get("erpProjectId");
  const { page, limit, skip } = parsePagination(searchParams);

  const salesAgent = await isSalesAgent(auth.user);
  const assignedIds = salesAgent ? await getAssignedClientIds(auth.user.id) : null;

  if (assignedIds && assignedIds.length === 0) {
    return apiSuccess([], paginationMeta(page, 0, limit));
  }

  const where = {
    deletedAt: null,
    ...(clientId ? { clientId } : {}),
    ...(erpProjectId ? { erpProjectId } : {}),
    ...(assignedIds ? { clientId: clientId ? clientId : { in: assignedIds } } : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, email: true, company: true } },
        erpProject: { select: { id: true, name: true, projectCode: true } },
        _count: { select: { services: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return apiSuccess(
    projects.map((p) => ({
      id: p.id,
      clientId: p.clientId,
      name: p.name,
      status: p.status,
      erpProjectId: p.erpProjectId,
      erpProject: p.erpProject,
      serviceCount: p._count.services,
      client: p.client,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    paginationMeta(page, total, limit)
  );
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const client = await prisma.user.findFirst({
    where: { id: parsed.data.clientId, role: "CUSTOMER" },
  });
  if (!client) return apiError("NOT_FOUND", "Client not found", 404);

  if (parsed.data.erpProjectId) {
    const erpProject = await prisma.erpProject.findUnique({
      where: { id: parsed.data.erpProjectId },
      select: { id: true },
    });
    if (!erpProject) return apiError("NOT_FOUND", "ERP project not found", 404);

    const linked = await prisma.project.findFirst({
      where: { erpProjectId: parsed.data.erpProjectId, deletedAt: null },
      select: { id: true },
    });
    if (linked) {
      return apiError("CONFLICT", "ERP project is already linked to another service project", 409);
    }
  }

  const project = await prisma.project.create({
    data: {
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      status: parsed.data.status ?? "ACTIVE",
      erpProjectId: parsed.data.erpProjectId ?? null,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    },
    include: {
      client: { select: { id: true, fullName: true, email: true, company: true } },
      erpProject: { select: { id: true, name: true, projectCode: true } },
      _count: { select: { services: { where: { deletedAt: null } } } },
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "service_project.create",
    module: "projects",
    entityType: "Project",
    entityId: project.id,
    summary: `Created service project ${project.name}`,
  });

  return apiSuccess(
    {
      id: project.id,
      clientId: project.clientId,
      name: project.name,
      status: project.status,
      erpProjectId: project.erpProjectId,
      erpProject: project.erpProject,
      serviceCount: project._count.services,
      client: project.client,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    undefined,
    201
  );
}
