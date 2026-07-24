import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/admin/require-admin";
import { getCommandCenterData } from "@/lib/dashboard/command-center";
import { getMaintenanceMessage } from "@/lib/admin/settings";

/** Expanded admin command-center dashboard widgets */
export async function GET() {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const data = await getCommandCenterData(auth.user.id);
  const maintenance = data.kpis.serverHealth === "maintenance";

  return NextResponse.json({
    widgets: data.kpis,
    alerts: data.alerts,
    recentActivities: data.recentActivities,
    upcomingCalendar: data.upcomingCalendar,
    quickActions: data.quickActions,
    maintenance,
    maintenanceMessage: maintenance ? await getMaintenanceMessage() : null,
  });
}
