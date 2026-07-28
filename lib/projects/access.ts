import type { SessionUser } from "@/lib/auth-types";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/erp/permissions";
import type { ProjectAccessLevel } from "@/shared/roles";

const ACCESS_RANK: Record<ProjectAccessLevel, number> = {
  view: 1,
  edit: 2,
  admin: 3,
};

export function accessLevelFromRole(role: string): ProjectAccessLevel {
  if (role === "LEAD") return "admin";
  if (role === "VIEWER") return "view";
  return "edit";
}

export function roleFromAccessLevel(level: ProjectAccessLevel): string {
  if (level === "admin") return "LEAD";
  if (level === "view") return "VIEWER";
  return "MEMBER";
}

export async function getProjectAccess(
  user: SessionUser,
  projectId: string
): Promise<ProjectAccessLevel | null> {
  if (isAdminRole(user.role)) return "admin";

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: user.id, deletedAt: null },
    select: { accessLevel: true, role: true },
  });

  if (!member) return null;

  const level = (member.accessLevel as ProjectAccessLevel) || accessLevelFromRole(member.role);
  return level;
}

export async function hasProjectAccess(
  user: SessionUser,
  projectId: string,
  minimum: ProjectAccessLevel
): Promise<boolean> {
  const level = await getProjectAccess(user, projectId);
  if (!level) return false;
  return ACCESS_RANK[level] >= ACCESS_RANK[minimum];
}

export async function requireProjectAccess(
  user: SessionUser,
  projectId: string,
  minimum: ProjectAccessLevel
): Promise<{ ok: true; level: ProjectAccessLevel } | { ok: false; message: string }> {
  const level = await getProjectAccess(user, projectId);
  if (!level) {
    return { ok: false, message: "You are not assigned to this project" };
  }
  if (ACCESS_RANK[level] < ACCESS_RANK[minimum]) {
    return { ok: false, message: `Requires ${minimum} access on this project` };
  }
  return { ok: true, level };
}

/** ERP manage permission or project edit/admin membership */
export async function canMutateProject(user: SessionUser, projectId: string): Promise<boolean> {
  if (isAdminRole(user.role)) return true;
  if (await hasPermission(user, "erp.projects.manage")) return true;
  return hasProjectAccess(user, projectId, "edit");
}
