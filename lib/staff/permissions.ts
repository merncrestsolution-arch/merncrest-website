import type { SessionUser } from "@/lib/auth-types";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ROLE_DEFAULT_PERMISSIONS,
  type StaffPermission,
  isWildcardPermissions,
} from "@/shared/permissions";

export async function hasStaffPermission(
  user: SessionUser,
  permission: StaffPermission
): Promise<boolean> {
  if (isAdminRole(user.role)) return true;

  const defaults = ROLE_DEFAULT_PERMISSIONS[user.role];
  if (isWildcardPermissions(defaults)) return true;
  if (defaults.includes(permission)) return true;

  const row = await prisma.staffPermission.findFirst({
    where: { userId: user.id, permission },
    select: { id: true },
  });
  return Boolean(row);
}

export async function requireStaffPermission(user: SessionUser, permission: StaffPermission) {
  const ok = await hasStaffPermission(user, permission);
  return ok;
}
