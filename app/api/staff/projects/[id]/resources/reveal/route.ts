import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { isAdminRole } from "@/lib/auth";
import { requireProjectAccess } from "@/lib/projects/access";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { decryptCredentials, decryptEnvVars } from "@/lib/security/project-secrets";
import { writeAuditLog } from "@/lib/erp/audit";
import { rateLimit, clientIp } from "@/lib/chat/rate-limit";

const revealSchema = z.object({
  field: z.enum(["envVars", "credentials"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canReveal =
    isAdminRole(auth.user.role) ||
    (await hasStaffPermission(auth.user, "projects.credentials.reveal"));
  if (!canReveal) {
    return apiError("FORBIDDEN", "Missing projects.credentials.reveal permission", 403);
  }

  const rl = rateLimit({
    key: `project:reveal:${auth.user.id}:${clientIp(request)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return apiError("RATE_LIMIT", "Too many credential reveal requests.", 429);
  }

  const { id: projectId } = await context.params;
  const access = await requireProjectAccess(auth.user, projectId, "view");
  if (!access.ok && !isAdminRole(auth.user.role)) {
    return apiError("FORBIDDEN", access.message, 403);
  }

  const resource = await prisma.projectResource.findFirst({
    where: { projectId, deletedAt: null },
  });
  if (!resource) return apiError("NOT_FOUND", "Project resources not found", 404);

  const body = await request.json();
  const parsed = revealSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid reveal field");

  const revealedAt = new Date();

  if (parsed.data.field === "envVars") {
    if (!resource.envVarsEncrypted) {
      return apiError("NOT_FOUND", "No environment variables stored", 404);
    }
    const value = decryptEnvVars(resource.envVarsEncrypted);
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: "project.credentials.reveal",
      module: "projects",
      entityType: "ProjectResource",
      entityId: resource.id,
      summary: `Revealed env vars for project ${projectId}`,
      meta: { projectId, field: "envVars", revealedAt: revealedAt.toISOString() },
    });
    return apiSuccess({ field: "envVars", value, revealedAt });
  }

  if (!resource.credentialsEncrypted) {
    return apiError("NOT_FOUND", "No credentials stored", 404);
  }
  const value = decryptCredentials(resource.credentialsEncrypted);
  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project.credentials.reveal",
    module: "projects",
    entityType: "ProjectResource",
    entityId: resource.id,
    summary: `Revealed credentials for project ${projectId}`,
    meta: { projectId, field: "credentials", revealedAt: revealedAt.toISOString() },
  });
  return apiSuccess({ field: "credentials", value, revealedAt });
}
