import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  accessLevelFromRole,
  roleFromAccessLevel,
  requireProjectAccess,
} from "@/lib/projects/access";
import type { ProjectAccessLevel } from "@/shared/roles";
import { isAdminRole } from "@/lib/auth";

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

  const members = await prisma.projectMember.findMany({
    where: { projectId, deletedAt: null },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      accessLevel: m.accessLevel || accessLevelFromRole(m.role),
      assignedById: m.assignedById,
      user: m.user,
    }))
  );
}

const addSchema = z.object({
  userId: z.string(),
  accessLevel: z.enum(["view", "edit", "admin"]).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage =
    isAdminRole(auth.user.role) || (await hasStaffPermission(auth.user, "team.manage"));
  if (!canManage) return apiError("FORBIDDEN", "Missing team.manage permission", 403);

  const { id: projectId } = await context.params;
  const body = await request.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid member data");

  const project = await prisma.erpProject.findUnique({ where: { id: projectId } });
  if (!project) return apiError("NOT_FOUND", "Project not found", 404);

  const level: ProjectAccessLevel = parsed.data.accessLevel ?? "edit";
  const role = roleFromAccessLevel(level);

  const member = await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId, userId: parsed.data.userId },
    },
    create: {
      projectId,
      userId: parsed.data.userId,
      role,
      accessLevel: level,
      assignedById: auth.user.id,
    },
    update: {
      role,
      accessLevel: level,
      assignedById: auth.user.id,
      deletedAt: null,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project.member.assign",
    module: "projects",
    entityType: "ProjectMember",
    entityId: member.id,
    summary: `Assigned ${member.user.fullName} to project ${project.name} (${level})`,
    meta: { projectId, userId: parsed.data.userId, accessLevel: level },
  });

  return apiSuccess(member, undefined, 201);
}

const patchSchema = z.object({
  userId: z.string(),
  accessLevel: z.enum(["view", "edit", "admin"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage =
    isAdminRole(auth.user.role) || (await hasStaffPermission(auth.user, "team.manage"));
  if (!canManage) return apiError("FORBIDDEN", "Missing team.manage permission", 403);

  const { id: projectId } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid update");

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: parsed.data.userId, deletedAt: null },
    include: { user: { select: { fullName: true } } },
  });
  if (!member) return apiError("NOT_FOUND", "Member not found", 404);

  const role = roleFromAccessLevel(parsed.data.accessLevel);
  const updated = await prisma.projectMember.update({
    where: { id: member.id },
    data: {
      accessLevel: parsed.data.accessLevel,
      role,
      assignedById: auth.user.id,
    },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project.member.access_change",
    module: "projects",
    entityType: "ProjectMember",
    entityId: member.id,
    summary: `Set ${member.user.fullName} access to ${parsed.data.accessLevel}`,
    meta: { projectId, accessLevel: parsed.data.accessLevel },
  });

  return apiSuccess(updated);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage =
    isAdminRole(auth.user.role) || (await hasStaffPermission(auth.user, "team.manage"));
  if (!canManage) return apiError("FORBIDDEN", "Missing team.manage permission", 403);

  const { id: projectId } = await context.params;
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return apiError("VALIDATION", "userId required");

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId, deletedAt: null },
    include: { user: { select: { fullName: true } } },
  });
  if (!member) return apiError("NOT_FOUND", "Member not found", 404);

  await prisma.projectMember.update({
    where: { id: member.id },
    data: { deletedAt: new Date() },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project.member.revoke",
    module: "projects",
    entityType: "ProjectMember",
    entityId: member.id,
    summary: `Removed ${member.user.fullName} from project`,
    meta: { projectId, userId },
  });

  return apiSuccess({ id: member.id });
}
