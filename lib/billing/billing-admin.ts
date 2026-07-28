import type { SessionUser } from "@/lib/auth-types";
import { isAdminRole } from "@/lib/auth";

/** Platform owner (OWNER) or super admin (ADMIN) — full invoice edit/delete. */
export function isBillingAdmin(user: SessionUser): boolean {
  return isAdminRole(user.role);
}
