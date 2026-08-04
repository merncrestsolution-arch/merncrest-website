/** Permission codes — named exports only (Vercel build constraint). */
import type { SystemRole } from "./roles";

export const STAFF_PERMISSIONS = [
  "sales.agent",
  "clients.view",
  "clients.manage",
  "projects.view",
  "projects.manage",
  "projects.credentials.reveal",
  "billing.view",
  "billing.manage",
  "domains.view",
  "domains.manage",
  "hosting.view",
  "hosting.manage",
  "hosting.credentials.reveal",
  "announcements.view",
  "announcements.manage",
  "documents.view",
  "documents.manage",
  "team.manage",
  "permissions.manage",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

/** View-only permissions for scoped sales agents (client access enforced in lib/sales/scope.ts). */
export const SALES_AGENT_DEFAULT_PERMISSIONS: StaffPermission[] = [
  "clients.view",
  "projects.view",
  "domains.view",
  "hosting.view",
  "billing.view",
];

export const ROLE_DEFAULT_PERMISSIONS: Record<SystemRole, StaffPermission[] | "*"> = {
  OWNER: "*",
  ADMIN: "*",
  STAFF: [
    "clients.view",
    "clients.manage",
    "projects.view",
    "projects.manage",
    "billing.view",
    "billing.manage",
    "domains.view",
    "hosting.view",
    "announcements.view",
    "documents.view",
  ],
  CUSTOMER: [],
};

export function isWildcardPermissions(
  perms: StaffPermission[] | "*"
): perms is "*" {
  return perms === "*";
}
