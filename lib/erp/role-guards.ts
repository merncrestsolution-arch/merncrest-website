import type { Role } from "@/lib/auth-types";
import type { OrgRole, SystemRole } from "@/shared/roles";

/** Branded platform role — never interchangeable with OrgRole at the type level. */
export type PlatformRole = Role & { readonly __brand: "PlatformRole" };

/** Branded organizational role — Employee.orgRole only. */
export type OrganizationalRole = OrgRole & { readonly __brand: "OrganizationalRole" };

const PLATFORM_ROLES: readonly SystemRole[] = ["CUSTOMER", "STAFF", "ADMIN", "OWNER"];
const ORG_ROLES: readonly OrgRole[] = [
  "CEO",
  "DIRECTOR",
  "GENERAL_MANAGER",
  "DEPT_HEAD",
  "TEAM_LEAD",
  "PROJECT_MANAGER",
  "ACCOUNTANT",
  "HR",
  "FINANCE",
  "SALES",
  "MARKETING",
  "SUPPORT",
  "DEVELOPER",
  "ENGINEER",
  "AUDITOR",
  "GENERAL_STAFF",
];

export function isPlatformRole(value: string): value is PlatformRole {
  return (PLATFORM_ROLES as readonly string[]).includes(value);
}

export function isOrgRole(value: string): value is OrganizationalRole {
  return (ORG_ROLES as readonly string[]).includes(value);
}

export function assertPlatformRole(value: string): PlatformRole {
  if (!isPlatformRole(value)) {
    throw new Error(`Invalid platform role: ${value}`);
  }
  return value;
}

export function assertOrgRole(value: string): OrganizationalRole {
  if (!isOrgRole(value)) {
    throw new Error(`Invalid organizational role: ${value}`);
  }
  return value;
}

/** Normalize legacy Employee.orgRole value STAFF → GENERAL_STAFF. */
export function normalizeOrgRole(value: string | null | undefined): OrgRole {
  if (!value || value === "STAFF") return "GENERAL_STAFF";
  if (isOrgRole(value)) return value;
  return "GENERAL_STAFF";
}
