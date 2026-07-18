import type { Role, SessionUser } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireStaff, requireUser } from "@/lib/commerce";

/** Canonical permission codes — Part 05 full matrix (view/manage pairs) */
export const ERP_PERMISSIONS = [
  "erp.hr.view",
  "erp.hr.manage",
  "erp.finance.view",
  "erp.finance.manage",
  "erp.procurement.view",
  "erp.procurement.manage",
  "erp.inventory.view",
  "erp.inventory.manage",
  "erp.scm.view",
  "erp.scm.manage",
  "erp.mfg.view",
  "erp.mfg.manage",
  "erp.projects.view",
  "erp.projects.manage",
  "erp.assets.view",
  "erp.assets.manage",
  "erp.esm.view",
  "erp.esm.manage",
  "erp.fsm.view",
  "erp.fsm.manage",
  "erp.iot.view",
  "erp.iot.manage",
  "erp.dms.view",
  "erp.dms.manage",
  "erp.ai.view",
  "erp.ai.manage",
  "erp.permissions.manage",
  "erp.analytics.view",
] as const;

export type ErpPermission = (typeof ERP_PERMISSIONS)[number];

/** Org-role presets (Employee.orgRole) mapped onto permissions */
export const ORG_ROLE_PRESETS: Record<string, ErpPermission[] | "*"> = {
  CEO: "*",
  DIRECTOR: "*",
  HR: ["erp.hr.view", "erp.hr.manage", "erp.dms.view", "erp.analytics.view"],
  FINANCE: [
    "erp.finance.view",
    "erp.finance.manage",
    "erp.procurement.view",
    "erp.analytics.view",
    "erp.dms.view",
  ],
  SALES: ["erp.projects.view", "erp.analytics.view", "erp.dms.view", "erp.ai.view"],
  MARKETING: ["erp.analytics.view", "erp.dms.view", "erp.ai.view"],
  SUPPORT: ["erp.esm.view", "erp.esm.manage", "erp.fsm.view", "erp.fsm.manage", "erp.analytics.view"],
  DEVELOPER: ["erp.projects.view", "erp.projects.manage", "erp.dms.view", "erp.ai.view"],
  ENGINEER: [
    "erp.assets.view",
    "erp.assets.manage",
    "erp.fsm.view",
    "erp.fsm.manage",
    "erp.iot.view",
    "erp.mfg.view",
    "erp.inventory.view",
  ],
  AUDITOR: [
    "erp.finance.view",
    "erp.hr.view",
    "erp.procurement.view",
    "erp.dms.view",
    "erp.analytics.view",
  ],
  STAFF: [
    "erp.hr.view",
    "erp.projects.view",
    "erp.assets.view",
    "erp.inventory.view",
    "erp.fsm.view",
    "erp.analytics.view",
    "erp.dms.view",
  ],
};

const ROLE_DEFAULTS: Record<Role, ErpPermission[] | "*"> = {
  OWNER: "*",
  ADMIN: "*",
  STAFF: ORG_ROLE_PRESETS.STAFF as ErpPermission[],
  CUSTOMER: [],
};

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
