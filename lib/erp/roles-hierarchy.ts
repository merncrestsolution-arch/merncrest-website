/**
 * System.merncrest.lk — User roles & permissions hierarchy (spec §2).
 * Org roles live on Employee.orgRole; User.role remains CUSTOMER|STAFF|ADMIN|OWNER.
 */

export type HierarchyTier =
  | "SUPER_ADMIN"
  | "DEPT_HEAD"
  | "TEAM_LEAD"
  | "STAFF"
  | "GUEST";

export type RoleCapability = {
  id: string;
  label: string;
};

export type HierarchyRoleDef = {
  tier: HierarchyTier;
  /** Employee.orgRole values that map to this tier */
  orgRoles: string[];
  /** Platform User.role values that also map here */
  userRoles?: string[];
  title: string;
  summary: string;
  capabilities: RoleCapability[];
};

export const SYSTEM_ROLE_HIERARCHY: HierarchyRoleDef[] = [
  {
    tier: "SUPER_ADMIN",
    orgRoles: ["CEO", "DIRECTOR", "GENERAL_MANAGER"],
    userRoles: ["OWNER", "ADMIN"],
    title: "Super Admin / CEO",
    summary: "Unified full access across System.merncrest.lk modules.",
    capabilities: [
      { id: "full", label: "Full system access across all modules" },
      { id: "users", label: "User and role management" },
      { id: "org", label: "Department and organizational structure configuration" },
      { id: "crm", label: "CRM customer database management" },
      { id: "reports", label: "Report generation and analytics access" },
      { id: "settings", label: "System settings, backup, and maintenance" },
      { id: "gateways", label: "WhatsApp and IVR gateway configuration" },
      { id: "integrations", label: "Integration management and API keys" },
      { id: "performance", label: "Staff performance reviews and evaluations" },
      { id: "billing", label: "Billing and payment tracking" },
      { id: "audit", label: "Audit logs and compliance reports" },
    ],
  },
  {
    tier: "DEPT_HEAD",
    orgRoles: ["DEPT_HEAD", "HR", "FINANCE", "SALES"],
    title: "Department Head / Manager",
    summary: "Staff and CRM scoped to the assigned department.",
    capabilities: [
      { id: "staff", label: "Staff management within assigned department" },
      { id: "assign", label: "Task and project assignment" },
      { id: "perf", label: "Performance tracking for direct reports" },
      { id: "crm", label: "Department-level CRM access (customers, interactions)" },
      { id: "comms", label: "Team communication and notifications" },
      { id: "reports", label: "Limited report generation (department-specific)" },
      { id: "leave", label: "Schedule and leave management approval" },
      { id: "training", label: "Training and development records" },
    ],
  },
  {
    tier: "TEAM_LEAD",
    orgRoles: ["TEAM_LEAD", "PROJECT_MANAGER"],
    title: "Team Lead",
    summary: "Supervise direct reports and team delivery.",
    capabilities: [
      { id: "supervise", label: "Team member supervision" },
      { id: "tasks", label: "Task monitoring and updates" },
      { id: "crm_log", label: "Customer interaction logging" },
      { id: "daily", label: "Daily reporting to manager" },
      { id: "metrics", label: "Team performance metrics" },
      { id: "chat", label: "Internal communication within team" },
      { id: "kb", label: "Document and knowledge base access" },
    ],
  },
  {
    tier: "STAFF",
    orgRoles: ["STAFF", "DEVELOPER", "ENGINEER", "SUPPORT", "MARKETING", "ACCOUNTANT", "AUDITOR"],
    userRoles: ["STAFF"],
    title: "Staff Member / Executive",
    summary: "Employee Self-Service on System.merncrest.lk.",
    capabilities: [
      { id: "profile", label: "Profile and personal information management" },
      { id: "tasks", label: "Task tracking and status updates" },
      { id: "crm_log", label: "CRM customer interaction logging" },
      { id: "leave", label: "Leave and attendance requests" },
      { id: "self_eval", label: "Performance self-evaluation" },
      { id: "training", label: "Training records access" },
      { id: "kb", label: "Internal knowledge base" },
      { id: "prefs", label: "Personal communication preferences" },
    ],
  },
  {
    tier: "GUEST",
    orgRoles: [],
    userRoles: ["CUSTOMER"],
    title: "Guest / Customer Portal",
    summary: "Optional self-service on portal.merncrest.lk (not System).",
    capabilities: [
      { id: "profile", label: "Self-service customer profile" },
      { id: "requests", label: "Service request submissions" },
      { id: "history", label: "Communication history" },
      { id: "payments", label: "Payment status" },
      { id: "limited", label: "Limited data access" },
    ],
  },
];

/** Canonical leave types (spec §3.2) */
export const SYSTEM_LEAVE_TYPES = [
  { code: "ANNUAL", label: "Annual Leave" },
  { code: "CASUAL", label: "Casual Leave" },
  { code: "SICK", label: "Sick Leave" },
  { code: "UNPAID", label: "Unpaid Leave" },
  { code: "MATERNITY", label: "Maternity Leave" },
  { code: "PATERNITY", label: "Paternity Leave" },
  { code: "STUDY", label: "Study Leave" },
  { code: "OTHER", label: "Custom / Other" },
] as const;

export const SYSTEM_LEAVE_TYPE_CODES = SYSTEM_LEAVE_TYPES.map((t) => t.code);

export function leaveTypeLabel(code: string) {
  return SYSTEM_LEAVE_TYPES.find((t) => t.code === code)?.label || code;
}
