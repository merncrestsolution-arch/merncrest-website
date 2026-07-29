import type { SessionUser } from "@/lib/auth-types";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { normalizeOrgRole } from "@/lib/erp/role-guards";

export type StaffScope = {
  isFullAccess: boolean;
  /** Cross-branch oversight — OWNER/ADMIN only */
  isCrossBranch: boolean;
  organizationId: string;
  /** null when isCrossBranch (OWNER/ADMIN); otherwise employee branch */
  branchId: string | null;
  orgRole: string | null;
  employeeId: string | null;
  departmentId: string | null;
  userId: string;
  /** User IDs this person can see (self + direct reports chain for team leads) */
  visibleUserIds: string[] | null;
};

async function resolveEmployeeBranchId(
  organizationId: string,
  employeeBranchId: string | null | undefined
): Promise<string | null> {
  if (employeeBranchId) return employeeBranchId;
  const head = await prisma.branch.findFirst({
    where: { organizationId, isHeadOffice: true, deletedAt: null },
    select: { id: true },
  });
  if (head) return head.id;
  const any = await prisma.branch.findFirst({
    where: { organizationId, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return any?.id ?? null;
}

/**
 * Operational data scope for System staff.
 * Every staff query must filter by organizationId + branchId (except OWNER/ADMIN cross-branch).
 */
export async function getStaffScope(user: SessionUser): Promise<StaffScope> {
  const organizationId = await getPrimaryOrganizationId();
  const crossBranch = isAdminRole(user.role);

  const employee = await prisma.employee.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      orgRole: true,
      departmentId: true,
      branchId: true,
    },
  });

  const orgRole =
    user.role === "OWNER" || user.role === "ADMIN"
      ? user.role
      : normalizeOrgRole(employee?.orgRole);

  const branchId = crossBranch
    ? null
    : await resolveEmployeeBranchId(organizationId, employee?.branchId);

  const fullAccess = crossBranch || user.role === "STAFF";

  return {
    isFullAccess: fullAccess,
    isCrossBranch: crossBranch,
    organizationId,
    branchId,
    orgRole,
    employeeId: employee?.id ?? null,
    departmentId: employee?.departmentId ?? null,
    userId: user.id,
    visibleUserIds: fullAccess ? null : [user.id],
  };
}

/** Canonical Prisma where fragment for tenant + branch isolation. */
export function staffDataScopeWhere(scope: StaffScope): Record<string, unknown> {
  const where: Record<string, unknown> = {
    organizationId: scope.organizationId,
  };
  if (!scope.isCrossBranch && scope.branchId) {
    where.branchId = scope.branchId;
  }
  return where;
}

/** Prisma where fragment for CrmLead visibility (scope + owner filter for restricted users). */
export function crmLeadScopeWhere(scope: StaffScope): Record<string, unknown> {
  const where = staffDataScopeWhere(scope) as Record<string, unknown>;
  if (!scope.isFullAccess) {
    where.ownerId = scope.userId;
  }
  return where;
}

/** Same tenant/branch filter for tickets. */
export function ticketScopeWhere(scope: StaffScope): Record<string, unknown> {
  return staffDataScopeWhere(scope);
}

/** Same tenant/branch filter for ERP delivery projects. */
export function erpProjectScopeWhere(scope: StaffScope): Record<string, unknown> {
  return staffDataScopeWhere(scope);
}

/** Same tenant/branch filter for staff-facing invoices. */
export function invoiceScopeWhere(scope: StaffScope): Record<string, unknown> {
  return staffDataScopeWhere(scope);
}
