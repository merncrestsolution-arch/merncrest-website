/** System role hierarchy — named exports only (Vercel build constraint). */
export type SystemRole = "CUSTOMER" | "STAFF" | "ADMIN" | "OWNER";

/** Delivery / project org roles (Employee.orgRole presets). */
export type OrgRole =
  | "CEO"
  | "DIRECTOR"
  | "GENERAL_MANAGER"
  | "DEPT_HEAD"
  | "TEAM_LEAD"
  | "PROJECT_MANAGER"
  | "ACCOUNTANT"
  | "HR"
  | "FINANCE"
  | "SALES"
  | "MARKETING"
  | "SUPPORT"
  | "DEVELOPER"
  | "ENGINEER"
  | "AUDITOR"
  | "GENERAL_STAFF";

/** Role hierarchy for permission inheritance (higher index = more privilege). */
export const ROLE_HIERARCHY: SystemRole[] = ["CUSTOMER", "STAFF", "ADMIN", "OWNER"];

export const ROLE_LABELS: Record<SystemRole, string> = {
  CUSTOMER: "Customer",
  STAFF: "Team Member",
  ADMIN: "Sub Admin",
  OWNER: "Owner",
};

/** Project-level access levels for per-project permissions. */
export type ProjectAccessLevel = "view" | "edit" | "admin";

export function roleRank(role: SystemRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasRoleAtLeast(role: SystemRole, minimum: SystemRole): boolean {
  return roleRank(role) >= roleRank(minimum);
}
