import type { SessionUser } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireStaff, requireUser } from "@/lib/commerce";
import {
  ERP_PERMISSIONS,
  type ErpPermission,
} from "@/lib/erp/permission-matrix";
import { getStaffScope, type StaffScope } from "@/lib/erp/staff-scope";
import { resolveEffectivePermissions } from "@/lib/erp/permission-resolve";

export {
  ERP_PERMISSIONS,
  ORG_ROLE_PRESETS,
  ROLE_DEFAULTS,
  type ErpPermission,
} from "@/lib/erp/permission-matrix";

export {
  getStaffScope,
  crmLeadScopeWhere,
  staffDataScopeWhere,
  ticketScopeWhere,
  erpProjectScopeWhere,
  invoiceScopeWhere,
  type StaffScope,
} from "@/lib/erp/staff-scope";

import { isAdminRole } from "@/lib/auth";
import type { Role } from "@/lib/auth-types";

/** OWNER and ADMIN — full platform access including staff/role management */
export function isSuperAdmin(role: Role) {
  return isAdminRole(role);
}

/** Destructive deletes (records, users, system config) — super admin only */
export function canPerformDestructiveAction(role: Role) {
  return isAdminRole(role);
}

export async function requireSuperAdmin() {
  const auth = await requireStaff();
  if (auth.error) return auth;
  if (!isSuperAdmin(auth.user.role)) {
    return {
      user: auth.user,
      error: NextResponse.json(
        { error: "Owner or Admin only — staff management and deletions are restricted." },
        { status: 403 }
      ),
    };
  }
  return { user: auth.user, error: undefined as undefined };
}

/**
 * Permission precedence — Model A (platform role is the hard ceiling).
 * See `lib/erp/permission-resolve.ts` for the full resolution algorithm and tests.
 *
 * OWNER / ADMIN receive the full ERP_PERMISSIONS set without intersection.
 */
export async function getUserPermissions(user: SessionUser): Promise<Set<string>> {
  if (user.role === "OWNER" || user.role === "ADMIN") {
    return new Set(ERP_PERMISSIONS);
  }

  const employee = await prisma.employee.findFirst({
    where: { userId: user.id },
    select: { orgRole: true },
  });

  const extras = await prisma.staffPermission.findMany({
    where: { userId: user.id },
    select: { permission: true },
  });

  return resolveEffectivePermissions({
    platformRole: user.role,
    orgRole: employee?.orgRole,
    extraGrants: extras.map((e) => e.permission),
  });
}

export async function hasPermission(user: SessionUser, permission: ErpPermission | ErpPermission[]) {
  const needed = Array.isArray(permission) ? permission : [permission];
  const perms = await getUserPermissions(user);
  return needed.some((p) => perms.has(p));
}

export async function requirePermission(permission: ErpPermission | ErpPermission[]) {
  const auth = await requireStaff();
  if (auth.error) return auth;

  const ok = await hasPermission(auth.user, permission);
  if (!ok) {
    return {
      user: auth.user,
      error: NextResponse.json({ error: "Missing permission" }, { status: 403 }),
    };
  }
  return { user: auth.user, error: undefined as undefined };
}

export async function requireErpStaff() {
  return requireStaff();
}

export async function requireStaffOrSelf() {
  return requireUser();
}

/** Permission + staff scope for department isolation */
export async function requirePermissionWithScope(permission: ErpPermission | ErpPermission[]) {
  const auth = await requirePermission(permission);
  if (auth.error) return { ...auth, scope: null as StaffScope | null };
  const scope = await getStaffScope(auth.user);
  return { user: auth.user, error: undefined as undefined, scope };
}
