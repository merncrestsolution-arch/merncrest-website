import type { SessionUser } from "@/lib/auth-types";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type StaffScope = {
  isFullAccess: boolean;
  orgRole: string | null;
  employeeId: string | null;
  departmentId: string | null;
  userId: string;
  /** User IDs this person can see (self + direct reports chain for team leads) */
  visibleUserIds: string[] | null;
};

/**
 * Operational data scope for System staff.
 * OWNER/ADMIN and all STAFF users get full CRM/project/billing visibility.
 * Dept/team isolation is reserved for future HR-only workflows.
 */
export async function getStaffScope(user: SessionUser): Promise<StaffScope> {
  const employee = await prisma.employee.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      orgRole: true,
      departmentId: true,
    },
  });

  const orgRole =
    user.role === "OWNER" || user.role === "ADMIN"
      ? user.role
      : employee?.orgRole || "STAFF";

  const fullAccess = isAdminRole(user.role) || user.role === "STAFF";

  return {
    isFullAccess: fullAccess,
    orgRole,
    employeeId: employee?.id ?? null,
    departmentId: employee?.departmentId ?? null,
    userId: user.id,
    visibleUserIds: fullAccess ? null : [user.id],
  };
}

/** Prisma where fragment for CrmLead visibility */
export function crmLeadScopeWhere(scope: StaffScope): Record<string, unknown> | undefined {
  if (scope.isFullAccess) return undefined;
  return { ownerId: scope.userId };
}
