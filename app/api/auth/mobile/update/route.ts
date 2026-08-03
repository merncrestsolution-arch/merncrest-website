import { NextResponse } from "next/server";
import { CONNECT_APP, connectApkFileName } from "@/lib/connect-app-meta";

/** Latest MernCrest Connect release metadata for in-app update checks. */
export async function GET(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "system.merncrest.lk";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const base = `${proto}://${host}`.replace(/\/$/, "");

  return NextResponse.json({
    name: CONNECT_APP.name,
    version: CONNECT_APP.version,
    build: CONNECT_APP.build,
    packageId: CONNECT_APP.packageId,
    downloadUrl: `${base}${CONNECT_APP.apkPath}`,
    downloadFileName: connectApkFileName(),
    releaseNotes: CONNECT_APP.releaseNotes,
    forceUpdate: CONNECT_APP.forceUpdate,
    minAndroid: CONNECT_APP.minAndroid,
  });
}
