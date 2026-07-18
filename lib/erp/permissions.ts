import type { Role, SessionUser } from "@/lib/auth-types";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireStaff, requireUser } from "@/lib/commerce";

/** Canonical permission codes for Part 05 ERP */
export const ERP_PERMISSIONS = [
  "erp.hr.view",
  "erp.hr.manage",
  "erp.finance.view",
  "erp.finance.manage",
  "erp.projects.view",
  "erp.projects.manage",
  "erp.assets.view",
  "erp.assets.manage",
  "erp.inventory.view",
  "erp.inventory.manage",
  "erp.fsm.view",
  "erp.fsm.manage",
  "erp.permissions.manage",
  "erp.analytics.view",
] as const;

export type ErpPermission = (typeof ERP_PERMISSIONS)[number];

const ROLE_DEFAULTS: Record<Role, ErpPermission[] | "*"> = {
  OWNER: "*",
  ADMIN: "*",
  STAFF: [
    "erp.hr.view",
    "erp.projects.view",
    "erp.projects.manage",
    "erp.assets.view",
    "erp.inventory.view",
    "erp.fsm.view",
    "erp.fsm.manage",
    "erp.analytics.view",
  ],
  CUSTOMER: [],
};

export async function getUserPermissions(user: SessionUser): Promise<Set<string>> {
  if (user.role === "OWNER" || user.role === "ADMIN") {
    return new Set(ERP_PERMISSIONS);
  }
  const defaults = ROLE_DEFAULTS[user.role] || [];
  const set = new Set<string>(defaults === "*" ? ERP_PERMISSIONS : defaults);
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

/** Self-service leave for any logged-in staff */
export async function requireStaffOrSelf() {
  return requireUser();
}
