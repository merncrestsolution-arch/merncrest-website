/**
 * Cloudflare Turnstile server-side verification.
 *
 * Graceful degradation: if TURNSTILE_SECRET_KEY is not configured, verification
 * is skipped (returns ok) so the app keeps working before Cloudflare is set up.
 * Once the secret is present, a valid token is required.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    // Optional until Cloudflare Turnstile keys are configured (see .env.example).
    return { ok: true };
  }

  if (!token) {
    return { ok: false, error: "Please complete the security check." };
  }

  try {
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    });

    const data = (await res.json()) as { success?: boolean };
    if (data.success) return { ok: true };

    return { ok: false, error: "Security check failed. Please try again." };
  } catch {
    // Fail closed on network/verification error to avoid bypass.
    return { ok: false, error: "Could not verify security check. Try again." };
  }
}
