import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff, nextNumber } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { canAccessClient } from "@/lib/sales/scope";

const createSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD"]).optional(),
});

/** Create an ERP project linked to a client (mobile / staff portal). */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "projects.manage");
  if (!canManage) return apiError("FORBIDDEN", "Missing projects.manage permission", 403);

  const { id } = await context.params;

  const customer = await prisma.user.findFirst({
    where: {
      OR: [{ id }, { profile: { customerCode: id } }],
      role: "CUSTOMER",
    },
    select: { id: true, fullName: true, company: true },
  });

  if (!customer) return apiError("NOT_FOUND", "Client not found", 404);

  const allowed = await canAccessClient(auth.user, customer.id);
  if (!allowed) return apiError("FORBIDDEN", "You do not have access to this client", 403);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid project");
  }

  const project = await prisma.erpProject.create({
    data: {
      projectCode: nextNumber("PRJ"),
      name: parsed.data.name,
      description: parsed.data.description,
      customerId: customer.id,
      status: parsed.data.status ?? "ACTIVE",
      members: { create: { userId: auth.user.id, role: "LEAD" } },
    },
    select: {
      id: true,
      projectCode: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project.create",
    module: "projects",
    entityType: "ErpProject",
    entityId: project.id,
    summary: `Created project ${project.projectCode} for ${customer.company ?? customer.fullName}`,
  });

  return apiSuccess(project, undefined, 201);
}
