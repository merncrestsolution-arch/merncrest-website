import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/admin/require-admin";
import { getCommandCenterData } from "@/lib/dashboard/command-center";
import { getMaintenanceMessage } from "@/lib/admin/settings";

/** Real-time KPI command center for System.merncrest.lk */
export async function GET() {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const data = await getCommandCenterData(auth.user.id);
  const maintenance = data.kpis.serverHealth === "maintenance";

  return NextResponse.json({
    ...data,
    maintenanceMessage: maintenance ? await getMaintenanceMessage() : null,
  });
}
