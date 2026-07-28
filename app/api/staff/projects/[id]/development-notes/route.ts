import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { isAdminRole } from "@/lib/auth";
import { canMutateProject, requireProjectAccess } from "@/lib/projects/access";
import { hasStaffPermission } from "@/lib/staff/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id: projectId } = await context.params;
  const access = await requireProjectAccess(auth.user, projectId, "view");
  if (!access.ok && !isAdminRole(auth.user.role)) {
    return apiError("FORBIDDEN", access.message, 403);
  }

  const project = await prisma.erpProject.findUnique({
    where: { id: projectId },
    select: {
      developmentNotes: true,
      progressOverridePct: true,
      nextSteps: true,
    },
  });
  if (!project) return apiError("NOT_FOUND", "Project not found", 404);

  return apiSuccess(project);
}

const patchSchema = z.object({
  developmentNotes: z.string().optional().nullable(),
  progressOverridePct: z.number().int().min(0).max(100).nullable().optional(),
  nextSteps: z.string().optional().nullable(),
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
  if (!parsed.success) return apiError("VALIDATION", "Invalid notes");

  const project = await prisma.erpProject.update({
    where: { id: projectId },
    data: {
      developmentNotes: parsed.data.developmentNotes,
      progressOverridePct: parsed.data.progressOverridePct,
      nextSteps: parsed.data.nextSteps,
    },
    select: {
      developmentNotes: true,
      progressOverridePct: true,
      nextSteps: true,
    },
  });

  return apiSuccess(project);
}
