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
  "erp.cloud.view",
  "erp.cloud.manage",
  "erp.monitoring.view",
  "erp.monitoring.manage",
  "website.offers.view",
  "website.offers.manage",
] as const;

/** Website / marketing content management */
export const WEBSITE_OFFERS_PERMISSIONS: ErpPermission[] = [
  "website.offers.view",
  "website.offers.manage",
];

export type ErpPermission = (typeof ERP_PERMISSIONS)[number];

/** Only OWNER / ADMIN (super admin) — staff & role management */
export const SUPER_ADMIN_ONLY_PERMISSIONS: ErpPermission[] = ["erp.permissions.manage"];

/** All modules staff need day-to-day — billing, CRM, projects, finance, etc. */
export const OPERATIONAL_PERMISSIONS: ErpPermission[] = ERP_PERMISSIONS.filter(
  (p) => !SUPER_ADMIN_ONLY_PERMISSIONS.includes(p)
);

/** Org-role presets (Employee.orgRole). CEO tier = full; everyone else = operational. */
export const ORG_ROLE_PRESETS: Record<string, ErpPermission[] | "*"> = {
  CEO: "*",
  DIRECTOR: "*",
  GENERAL_MANAGER: "*",
  DEPT_HEAD: OPERATIONAL_PERMISSIONS,
  TEAM_LEAD: OPERATIONAL_PERMISSIONS,
  PROJECT_MANAGER: OPERATIONAL_PERMISSIONS,
  ACCOUNTANT: OPERATIONAL_PERMISSIONS,
  HR: OPERATIONAL_PERMISSIONS,
  FINANCE: OPERATIONAL_PERMISSIONS,
  SALES: OPERATIONAL_PERMISSIONS,
  MARKETING: OPERATIONAL_PERMISSIONS,
  WEBSITE_MANAGER: WEBSITE_OFFERS_PERMISSIONS,
  CONTENT_MANAGER: WEBSITE_OFFERS_PERMISSIONS,
  SUPPORT: OPERATIONAL_PERMISSIONS,
  DEVELOPER: OPERATIONAL_PERMISSIONS,
  ENGINEER: OPERATIONAL_PERMISSIONS,
  AUDITOR: OPERATIONAL_PERMISSIONS,
  GENERAL_STAFF: OPERATIONAL_PERMISSIONS,
};

export const ROLE_DEFAULTS: Record<Role, ErpPermission[] | "*"> = {
  OWNER: "*",
  ADMIN: "*",
  STAFF: OPERATIONAL_PERMISSIONS,
  CUSTOMER: [],
};
