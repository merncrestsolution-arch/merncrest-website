export type EnterpriseSolution = {
  slug: string;
  title: string;
  description: string;
  category: "core" | "module";
};

export const enterpriseSolutions: EnterpriseSolution[] = [
  { slug: "erp", title: "Enterprise Resource Planning (ERP)", description: "Unify finance, inventory, operations, and reporting in one system.", category: "core" },
  { slug: "eam", title: "Enterprise Asset Management (EAM)", description: "Track, maintain, and optimize physical and digital assets.", category: "core" },
  { slug: "esm", title: "Enterprise Service Management (ESM)", description: "Standardize service delivery across departments.", category: "core" },
  { slug: "fsm", title: "Field Service Management (FSM)", description: "Schedule, dispatch, and close field jobs with live visibility.", category: "core" },
  { slug: "project-management", title: "Resource & Project Management", description: "Plan milestones, capacity, and delivery for software and ops teams.", category: "core" },
  { slug: "supply-chain", title: "Supply Chain Management", description: "End-to-end procurement, logistics, and supplier coordination.", category: "core" },
  { slug: "finance", title: "Finance & Accounting", description: "Ledgers, tax invoices, receivables, and financial controls.", category: "core" },
  { slug: "hr", title: "Human Resource Management", description: "People ops, attendance, payroll hooks, and performance.", category: "core" },
  { slug: "manufacturing", title: "Manufacturing Solutions", description: "Production planning, BOM, and shop-floor visibility.", category: "core" },
  { slug: "ai-cloud", title: "AI & Cloud Enterprise Software", description: "Intelligent automation on scalable cloud infrastructure.", category: "core" },
  { slug: "iiot", title: "Industrial IoT Solutions", description: "Connect machines, sensors, and operations data.", category: "core" },
  { slug: "predictive-maintenance", title: "Predictive Maintenance", description: "Reduce downtime with AI-driven maintenance signals.", category: "core" },
  { slug: "analytics", title: "Business Analytics & Reporting", description: "Dashboards and KPIs for owners and operators.", category: "core" },
  { slug: "csm", title: "Customer Service Management", description: "Tickets, SLAs, and omnichannel care in one place.", category: "core" },
  { slug: "document-management", title: "Document Management", description: "Secure storage, versioning, and approvals.", category: "module" },
  { slug: "inventory", title: "Inventory Management", description: "Stock levels, batches, and replenishment.", category: "module" },
  { slug: "warehouse", title: "Warehouse Management", description: "Inbound, picking, packing, and warehouse ops.", category: "module" },
  { slug: "fleet", title: "Fleet Management", description: "Vehicles, routes, and utilization tracking.", category: "module" },
  { slug: "visitor", title: "Visitor Management", description: "Check-in, badges, and facility access logs.", category: "module" },
  { slug: "lms", title: "Learning Management", description: "Training paths, courses, and certifications.", category: "module" },
  { slug: "workflow", title: "Workflow Automation", description: "Approvals, notifications, and process orchestration.", category: "module" },
  { slug: "procurement", title: "Procurement Management", description: "Requisitions, POs, and vendor cycles.", category: "module" },
  { slug: "multi-company", title: "Multi-Company Management", description: "Operate multiple legal entities from one platform.", category: "module" },
  { slug: "multi-branch", title: "Multi-Branch Management", description: "Branch-level ops with consolidated reporting.", category: "module" },
  { slug: "bi", title: "Business Intelligence", description: "Advanced insights across CRM, ERP, and billing.", category: "module" },
];

export function getEnterpriseSolution(slug: string) {
  return enterpriseSolutions.find((s) => s.slug === slug);
}
