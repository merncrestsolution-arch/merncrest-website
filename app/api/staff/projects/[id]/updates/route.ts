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

  const updates = await prisma.projectClientUpdate.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess(updates);
}

const createSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  processStage: z.string().optional(),
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
  if (!parsed.success) return apiError("VALIDATION", "Invalid update");

  const update = await prisma.projectClientUpdate.create({
    data: {
      projectId,
      title: parsed.data.title,
      body: parsed.data.body,
      processStage: parsed.data.processStage,
      createdById: auth.user.id,
    },
  });

  if (parsed.data.processStage) {
    await prisma.erpProject.update({
      where: { id: projectId },
      data: { nextProcess: parsed.data.processStage },
    });
  }

  return apiSuccess(update, undefined, 201);
}
