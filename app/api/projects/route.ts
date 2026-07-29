import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { parsePagination, paginationMeta } from "@/lib/services/pagination";

const createSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(200),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
});

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "projects.view");
  if (!canView) return apiError("FORBIDDEN", "Missing projects.view permission", 403);

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const { page, limit, skip } = parsePagination(searchParams);

  const where = {
    deletedAt: null,
    ...(clientId ? { clientId } : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, email: true, company: true } },
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

  const project = await prisma.project.create({
    data: {
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      status: parsed.data.status ?? "ACTIVE",
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    },
    include: {
      client: { select: { id: true, fullName: true, email: true, company: true } },
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project.create",
    module: "projects",
    entityType: "Project",
    entityId: project.id,
    summary: `Created project ${project.name}`,
  });

  return apiSuccess(
    {
      id: project.id,
      clientId: project.clientId,
      name: project.name,
      status: project.status,
      client: project.client,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    undefined,
    201
  );
}
