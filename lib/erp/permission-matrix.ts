import type { Role } from "@/lib/auth-types";

/** Canonical permission codes — Part 05 full matrix (view/manage pairs) */
export const ERP_PERMISSIONS = [
  "erp.hr.view",
  "erp.hr.manage",
  "erp.finance.view",
  "erp.finance.manage",
  "erp.procurement.view",
  "erp.procurement.manage",
  "erp.inventory.view",
  "erp.inventory.manage",
  "erp.scm.view",
  "erp.scm.manage",
  "erp.mfg.view",
  "erp.mfg.manage",
  "erp.projects.view",
  "erp.projects.manage",
  "erp.assets.view",
  "erp.assets.manage",
  "erp.esm.view",
  "erp.esm.manage",
  "erp.fsm.view",
  "erp.fsm.manage",
  "erp.iot.view",
  "erp.iot.manage",
  "erp.dms.view",
  "erp.dms.manage",
  "erp.ai.view",
  "erp.ai.manage",
  "erp.permissions.manage",
  "erp.analytics.view",
] as const;

export type ErpPermission = (typeof ERP_PERMISSIONS)[number];

/** Org-role presets (Employee.orgRole) mapped onto permissions */
export const ORG_ROLE_PRESETS: Record<string, ErpPermission[] | "*"> = {
  CEO: "*",
  DIRECTOR: "*",
  HR: ["erp.hr.view", "erp.hr.manage", "erp.dms.view", "erp.analytics.view"],
  FINANCE: [
    "erp.finance.view",
    "erp.finance.manage",
    "erp.procurement.view",
    "erp.analytics.view",
    "erp.dms.view",
  ],
  SALES: ["erp.projects.view", "erp.analytics.view", "erp.dms.view", "erp.ai.view"],
  MARKETING: ["erp.analytics.view", "erp.dms.view", "erp.ai.view"],
  SUPPORT: ["erp.esm.view", "erp.esm.manage", "erp.fsm.view", "erp.fsm.manage", "erp.analytics.view"],
  DEVELOPER: ["erp.projects.view", "erp.projects.manage", "erp.dms.view", "erp.ai.view"],
  ENGINEER: [
    "erp.assets.view",
    "erp.assets.manage",
    "erp.fsm.view",
    "erp.fsm.manage",
    "erp.iot.view",
    "erp.mfg.view",
    "erp.inventory.view",
  ],
  AUDITOR: [
    "erp.finance.view",
    "erp.hr.view",
    "erp.procurement.view",
    "erp.dms.view",
    "erp.analytics.view",
  ],
  STAFF: [
    "erp.hr.view",
    "erp.projects.view",
    "erp.assets.view",
    "erp.inventory.view",
    "erp.fsm.view",
    "erp.analytics.view",
    "erp.dms.view",
  ],
};

export const ROLE_DEFAULTS: Record<Role, ErpPermission[] | "*"> = {
  OWNER: "*",
  ADMIN: "*",
  STAFF: ORG_ROLE_PRESETS.STAFF as ErpPermission[],
  CUSTOMER: [],
};
