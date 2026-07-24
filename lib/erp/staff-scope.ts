import type { SessionUser } from "@/lib/auth-types";
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
 * Resolve department / reporting scope for System staff (CEO vs DEPT_HEAD vs TEAM_LEAD vs STAFF).
 */
export async function getStaffScope(user: SessionUser): Promise<StaffScope> {
  if (user.role === "OWNER" || user.role === "ADMIN") {
    return {
      isFullAccess: true,
      orgRole: user.role,
      employeeId: null,
      departmentId: null,
      userId: user.id,
      visibleUserIds: null,
    };
  }

  const employee = await prisma.employee.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      orgRole: true,
      departmentId: true,
      directReports: { select: { userId: true, id: true } },
    },
  });

  const orgRole = employee?.orgRole || "STAFF";

  if (orgRole === "CEO" || orgRole === "DIRECTOR" || orgRole === "GENERAL_MANAGER") {
    return {
      isFullAccess: true,
      orgRole,
      employeeId: employee?.id ?? null,
      departmentId: employee?.departmentId ?? null,
      userId: user.id,
      visibleUserIds: null,
    };
  }

  if (orgRole === "DEPT_HEAD" && employee?.departmentId) {
    const peers = await prisma.employee.findMany({
      where: { departmentId: employee.departmentId, userId: { not: null } },
      select: { userId: true },
    });
    const ids = peers.map((p) => p.userId!).filter(Boolean);
    ids.push(user.id);
    return {
      isFullAccess: false,
      orgRole,
      employeeId: employee.id,
      departmentId: employee.departmentId,
      userId: user.id,
      visibleUserIds: [...new Set(ids)],
    };
  }

  if (orgRole === "TEAM_LEAD" && employee) {
    const reportUserIds = employee.directReports
      .map((r) => r.userId)
      .filter((id): id is string => Boolean(id));
    return {
      isFullAccess: false,
      orgRole,
      employeeId: employee.id,
      departmentId: employee.departmentId,
      userId: user.id,
      visibleUserIds: [...new Set([user.id, ...reportUserIds])],
    };
  }

  return {
    isFullAccess: false,
    orgRole,
    employeeId: employee?.id ?? null,
    departmentId: employee?.departmentId ?? null,
    userId: user.id,
    visibleUserIds: [user.id],
  };
}

/** Prisma where fragment for CrmLead visibility */
export function crmLeadScopeWhere(scope: StaffScope): Record<string, unknown> | undefined {
  if (scope.isFullAccess) return undefined;
  if (scope.orgRole === "DEPT_HEAD" && scope.departmentId) {
    return {
      OR: [
        { departmentId: scope.departmentId },
        { ownerId: { in: scope.visibleUserIds || [scope.userId] } },
        { teamLeadId: scope.userId },
      ],
    };
  }
  if (scope.orgRole === "TEAM_LEAD") {
    return {
      OR: [
        { teamLeadId: scope.userId },
        { ownerId: { in: scope.visibleUserIds || [scope.userId] } },
      ],
    };
  }
  return { ownerId: scope.userId };
}
