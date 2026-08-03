import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/commerce";
import { getUserPermissions } from "@/lib/erp/permissions";
import { hasStaffPermission } from "@/lib/staff/permissions";
import type { StaffPermission } from "@/shared/permissions";
import { isAdminRole } from "@/lib/auth";

type NavTab = {
  id: string;
  label: string;
  route: string;
  icon: string;
  badge?: number;
};

type NavGroup = {
  id: string;
  label: string;
  items: { label: string; route: string; icon: string }[];
};

async function can(user: { id: string; role: string }, perm: StaffPermission) {
  return hasStaffPermission(user as Parameters<typeof hasStaffPermission>[0], perm);
}

/** Dynamic navigation config for MernCrest Connect mobile shell. */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { user } = auth;
  const permissions = await getUserPermissions(user);
  const superAdmin = isAdminRole(user.role);

  const tabs: NavTab[] = [{ id: "home", label: "Home", route: "/home", icon: "dashboard" }];

  tabs.push({ id: "work", label: "Work", route: "/work", icon: "work" });

  if (
    (await can(user, "clients.view")) ||
    Array.from(permissions).some((p) => p.startsWith("erp.crm"))
  ) {
    tabs.push({ id: "clients", label: "Clients", route: "/clients", icon: "clients" });
  }

  tabs.push({ id: "chat", label: "Chat", route: "/chat", icon: "chat" });
  tabs.push({ id: "more", label: "More", route: "/more", icon: "more" });

  const groups: NavGroup[] = [
    {
      id: "my-work",
      label: "My Work",
      items: [
        { label: "Profile", route: "/profile", icon: "person" },
        { label: "Attendance", route: "/attendance", icon: "schedule" },
        { label: "Leave", route: "/leave", icon: "flight" },
        { label: "Payslip", route: "/payslip", icon: "receipt" },
        { label: "Performance", route: "/performance", icon: "trending_up" },
        { label: "Calendar", route: "/calendar", icon: "calendar" },
        { label: "Training", route: "/training", icon: "school" },
        { label: "Tasks", route: "/tasks", icon: "task" },
      ],
    },
  ];

  if (await can(user, "clients.view")) {
    groups.push({
      id: "clients-projects",
      label: "Clients & Projects",
      items: [
        { label: "Clients", route: "/clients", icon: "groups" },
        { label: "Projects", route: "/projects", icon: "folder" },
        { label: "Sales Pipeline", route: "/sales", icon: "pipeline" },
        { label: "Progress", route: "/projects/progress", icon: "analytics" },
      ],
    });
  }

  if (await can(user, "billing.view")) {
    groups.push({
      id: "billing",
      label: "Billing",
      items: [
        { label: "Invoices", route: "/billing", icon: "payments" },
        { label: "Receipts", route: "/receipts", icon: "receipt_long" },
        { label: "Quotations", route: "/quotations", icon: "request_quote" },
      ],
    });
  }

  if (
    (await can(user, "domains.view")) ||
    (await can(user, "hosting.view"))
  ) {
    groups.push({
      id: "resources",
      label: "Resources",
      items: [
        { label: "Domains", route: "/domains", icon: "language" },
        { label: "DNS", route: "/dns", icon: "dns" },
        { label: "Hosting", route: "/hosting", icon: "dns" },
        { label: "Resources Hub", route: "/resources", icon: "hub" },
        { label: "AWS Cloud", route: "/cloud", icon: "cloud" },
        { label: "Monitoring", route: "/monitoring", icon: "monitor_heart" },
      ],
    });
  }

  groups.push({
    id: "communications",
    label: "Communications",
    items: [
      { label: "Announcements", route: "/announcements", icon: "campaign" },
      { label: "Notifications", route: "/notifications", icon: "notifications" },
      { label: "Helpdesk", route: "/tickets", icon: "support_agent" },
      { label: "Live Chat", route: "/live-chat", icon: "chat" },
      { label: "WhatsApp CRM", route: "/whatsapp", icon: "whatsapp" },
      { label: "Internal Chat", route: "/internal-chat", icon: "forum" },
    ],
  });

  if (superAdmin) {
    groups.push({
      id: "operations",
      label: "Operations",
      items: [{ label: "Command Center", route: "/command-center", icon: "hub" }],
    });
  }

  const homeWidgets = [
    "greeting",
    "attendance",
    "tasks",
    "notifications",
    ...(superAdmin ? ["command_kpis"] : []),
    ...(await can(user, "billing.view") ? ["revenue"] : []),
    "announcements",
  ];

  return NextResponse.json({
    tabs: tabs.slice(0, 5),
    groups,
    homeWidgets,
    stitchProjectId: "16091446373131283598",
  });
}
