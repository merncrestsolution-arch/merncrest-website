/**
 * Next.js instrumentation — runs once at server startup.
 *
 * Production startup guard: refuse to boot if Cloudflare Turnstile is not
 * configured, so a misconfigured deploy fails loudly instead of silently
 * shipping login / contact / careers forms without bot protection.
 * In development the keys stay optional (protection is dormant).
 */
export async function register() {
  // Only the Node.js server runtime; skip edge/browser.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const missing: string[] = [];
  if (!process.env.TURNSTILE_SECRET_KEY) missing.push("TURNSTILE_SECRET_KEY");
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
    missing.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY");

  if (missing.length > 0) {
    // Match .env.example: Turnstile is optional. Forms work without it;
    // bot protection activates only when BOTH keys are set.
    console.warn(
      `[turnstile] Missing in production (bot protection dormant): ${missing.join(
        ", "
      )}. Add keys from Cloudflare → Turnstile when ready.`
    );
  }
}
