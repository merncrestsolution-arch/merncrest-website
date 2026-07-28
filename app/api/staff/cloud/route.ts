import { NextResponse } from "next/server";
import { getCloudDashboard } from "@/lib/cloud/aws-dashboard";
import { requirePermission } from "@/lib/erp/permissions";

export async function GET() {
  const auth = await requirePermission("erp.cloud.view");
  if (auth.error) return auth.error;

  const data = await getCloudDashboard();
  return NextResponse.json(data);
}
