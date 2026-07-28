import { NextResponse } from "next/server";
import { getMonitoringDashboard } from "@/lib/monitoring/dashboard";
import { requirePermission } from "@/lib/erp/permissions";

export async function GET() {
  const auth = await requirePermission("erp.monitoring.view");
  if (auth.error) return auth.error;

  const data = await getMonitoringDashboard();
  return NextResponse.json(data);
}
