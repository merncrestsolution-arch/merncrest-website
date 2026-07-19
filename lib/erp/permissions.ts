import type { SessionUser } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireStaff, requireUser } from "@/lib/commerce";
import {
  ERP_PERMISSIONS,
  ORG_ROLE_PRESETS,
  ROLE_DEFAULTS,
  type ErpPermission,
} from "@/lib/erp/permission-matrix";

export {
  ERP_PERMISSIONS,
  ORG_ROLE_PRESETS,
  ROLE_DEFAULTS,
  type ErpPermission,
} from "@/lib/erp/permission-matrix";

export async function getUserPermissions(user: SessionUser): Promise<Set<string>> {
  if (user.role === "OWNER" || user.role === "ADMIN") {
    return new Set(ERP_PERMISSIONS);
  }

  const set = new Set<string>();
  const defaults = ROLE_DEFAULTS[user.role] || [];
  if (defaults === "*") ERP_PERMISSIONS.forEach((p) => set.add(p));
  else defaults.forEach((p) => set.add(p));

  const employee = await prisma.employee.findFirst({
    where: { userId: user.id },
    select: { orgRole: true },
  });
  if (employee?.orgRole) {
    const preset = ORG_ROLE_PRESETS[employee.orgRole];
    if (preset === "*") ERP_PERMISSIONS.forEach((p) => set.add(p));
    else if (preset) preset.forEach((p) => set.add(p));
  }

  const extras = await prisma.staffPermission.findMany({
    where: { userId: user.id },
    select: { permission: true },
  });
  extras.forEach((e) => set.add(e.permission));
  return set;
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
