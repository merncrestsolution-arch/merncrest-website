import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { isAdminRole } from "@/lib/auth";
import { canMutateProject } from "@/lib/projects/access";
import { hasStaffPermission } from "@/lib/staff/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id: projectId } = await context.params;

  const items = await prisma.projectFutureImprovement.findMany({
    where: { projectId, deletedAt: null },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return apiSuccess(items);
}

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["BACKLOG", "SCHEDULED", "DONE", "DROPPED"]).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id: projectId } = await context.params;
  const canEdit =
    isAdminRole(auth.user.role) ||
    (await hasStaffPermission(auth.user, "projects.manage")) ||
    (await canMutateProject(auth.user, projectId));
  if (!canEdit) return apiError("FORBIDDEN", "Requires project edit access", 403);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid backlog item");

  const item = await prisma.projectFutureImprovement.create({
    data: {
      projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status ?? "BACKLOG",
      createdById: auth.user.id,
    },
  });

  return apiSuccess(item, undefined, 201);
}

const patchSchema = z.object({
  id: z.string(),
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["BACKLOG", "SCHEDULED", "DONE", "DROPPED"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id: projectId } = await context.params;
  const canEdit =
    isAdminRole(auth.user.role) ||
    (await hasStaffPermission(auth.user, "projects.manage")) ||
    (await canMutateProject(auth.user, projectId));
  if (!canEdit) return apiError("FORBIDDEN", "Requires project edit access", 403);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid update");

  const existing = await prisma.projectFutureImprovement.findFirst({
    where: { id: parsed.data.id, projectId, deletedAt: null },
  });
  if (!existing) return apiError("NOT_FOUND", "Item not found", 404);

  const item = await prisma.projectFutureImprovement.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
    },
  });

  return apiSuccess(item);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id: projectId } = await context.params;
  const canEdit =
    isAdminRole(auth.user.role) ||
    (await hasStaffPermission(auth.user, "projects.manage")) ||
    (await canMutateProject(auth.user, projectId));
  if (!canEdit) return apiError("FORBIDDEN", "Requires project edit access", 403);

  const itemId = new URL(request.url).searchParams.get("id");
  if (!itemId) return apiError("VALIDATION", "id required");

  const existing = await prisma.projectFutureImprovement.findFirst({
    where: { id: itemId, projectId, deletedAt: null },
  });
  if (!existing) return apiError("NOT_FOUND", "Item not found", 404);

  await prisma.projectFutureImprovement.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });

  return apiSuccess({ id: existing.id });
}
