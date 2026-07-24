type HeaderSource = { headers: { get(name: string): string | null } };

/**
 * Whether auth/surface cookies should use the Secure flag.
 * Over plain HTTP (e.g. Lightsail IP before TLS) Secure cookies are dropped by browsers.
 * Behind Cloudflare HTTPS, X-Forwarded-Proto is "https".
 */
export function isSecureRequest(request?: HeaderSource) {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  const proto = request?.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (proto) return proto === "https";

  return false;
}
