import { NextResponse } from "next/server";
import { isTurnstileEnabled } from "@/lib/security/turnstile";

/** Public config for MernCrest Connect (Turnstile site key, etc.). */
export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
  return NextResponse.json({
    turnstileSiteKey: siteKey,
    turnstileRequired: isTurnstileEnabled(),
    apiHost: process.env.NEXT_PUBLIC_SITE_URL || "https://system.merncrest.lk",
  });
}
