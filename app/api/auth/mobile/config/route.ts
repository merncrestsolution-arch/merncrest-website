import { NextResponse } from "next/server";
import { isTurnstileEnabled } from "@/lib/security/turnstile";

function isConnectMobileClient(request: Request) {
  return request.headers.get("x-merncrest-client") === "connect-mobile";
}

/** Public config for MernCrest Connect (Turnstile site key, etc.). */
export async function GET(request: Request) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
  const mobile = isConnectMobileClient(request);

  return NextResponse.json({
    turnstileSiteKey: mobile ? "" : siteKey,
    // Turnstile WebView is unreliable in native shells — web login still uses Turnstile.
    turnstileRequired: mobile ? false : isTurnstileEnabled(),
    apiHost: process.env.NEXT_PUBLIC_SITE_URL || "https://system.merncrest.lk",
  });
}
