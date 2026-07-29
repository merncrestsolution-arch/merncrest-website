import type { SessionUser } from "@/lib/auth-types";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const SALES_ORG_ROLES = new Set(["SALES"]);

type ScopeUser = Pick<SessionUser, "id" | "role">;

export async function isSalesAgent(user: ScopeUser): Promise<boolean> {
  if (isAdminRole(user.role)) return false;

  const [permissionRow, employee] = await Promise.all([
    prisma.staffPermission.findFirst({
      where: { userId: user.id, permission: "sales.agent" },
      select: { id: true },
    }),
    prisma.employee.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: { orgRole: true },
    }),
  ]);

  if (permissionRow) return true;
  if (employee?.orgRole && SALES_ORG_ROLES.has(employee.orgRole)) return true;

  return false;
}

export async function getAssignedClientIds(agentId: string): Promise<string[]> {
  const rows = await prisma.salesClientAssignment.findMany({
    where: { agentId },
    select: { clientId: true },
  });
  return rows.map((row) => row.clientId);
}

export async function canAccessClient(user: ScopeUser, clientId: string): Promise<boolean> {
  if (user.role === "CUSTOMER") {
    return user.id === clientId;
  }

  if (isAdminRole(user.role)) {
    return true;
  }

  if (user.role !== "STAFF") {
    return false;
  }

  const salesAgent = await isSalesAgent(user);
  if (!salesAgent) {
    return true;
  }

  const assignment = await prisma.salesClientAssignment.findFirst({
    where: { agentId: user.id, clientId },
    select: { id: true },
  });

  return Boolean(assignment);
}
