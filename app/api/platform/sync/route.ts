import { NextResponse } from "next/server";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { buildPlatformSyncPayload } from "@/lib/platform/sync-payload";

/**
 * Unified auto-sync snapshot / delta for website portal, system staff, and mobile.
 * `GET /api/platform/sync?since=ISO8601` — returns changes since last sync.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since");
  let since: Date | null = null;
  if (sinceRaw) {
    const parsed = new Date(sinceRaw);
    if (!Number.isNaN(parsed.getTime())) since = parsed;
  }

  const payload = await buildPlatformSyncPayload(user, since);

  return NextResponse.json({
    ...payload,
    surface: isStaffRole(user.role) ? "staff" : "customer",
    userId: user.id,
  });
}
