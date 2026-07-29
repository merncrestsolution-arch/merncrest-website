import {
  ERP_PERMISSIONS,
  ORG_ROLE_PRESETS,
  ROLE_DEFAULTS,
  type ErpPermission,
} from "@/lib/erp/permission-matrix";
import type { Role } from "@/lib/auth-types";
import { normalizeOrgRole } from "@/lib/erp/role-guards";

/**
 * Permission precedence — Model A (platform role is the hard ceiling).
 *
 * 1. ROLE_DEFAULTS[user.role] defines the maximum permission set (ceiling).
 * 2. ORG_ROLE_PRESETS[employee.orgRole] may only grant permissions already in the ceiling.
 *    CEO org role on a STAFF platform user does NOT yield erp.permissions.manage or blanket *.
 * 3. StaffPermission extras are also capped to the ceiling — never beyond platform role.
 *
 * OWNER / ADMIN bypass this and receive the full ERP_PERMISSIONS set in getUserPermissions().
 */
export function expandPermissionPreset(
  preset: ErpPermission[] | "*" | undefined
): Set<string> {
  const set = new Set<string>();
  if (!preset) return set;
  if (preset === "*") {
    ERP_PERMISSIONS.forEach((p) => set.add(p));
  } else {
    preset.forEach((p) => set.add(p));
  }
  return set;
}

export function intersectPermissionSets(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const p of a) {
    if (b.has(p)) out.add(p);
  }
  return out;
}

export function resolveEffectivePermissions(opts: {
  platformRole: Role;
  orgRole: string | null | undefined;
  extraGrants: string[];
}): Set<string> {
  const ceiling = expandPermissionPreset(ROLE_DEFAULTS[opts.platformRole]);
  const normalizedOrg = opts.orgRole ? normalizeOrgRole(opts.orgRole) : null;
  const orgPreset = normalizedOrg ? ORG_ROLE_PRESETS[normalizedOrg] : undefined;
  const orgGrants = expandPermissionPreset(orgPreset);

  let effective: Set<string>;
  if (orgGrants.size > 0) {
    effective = intersectPermissionSets(ceiling, orgGrants);
  } else {
    effective = new Set(ceiling);
  }

  for (const grant of opts.extraGrants) {
    if (ceiling.has(grant)) {
      effective.add(grant);
    }
  }

  return effective;
}
