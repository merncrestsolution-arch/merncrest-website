/** Canonical public marketing site — never localhost/IP in visitor-facing chat. */
export const PUBLIC_SITE_ORIGIN = "https://merncrest.lk";

const LOCAL_HOST_RE =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\d{1,3}(?:\.\d{1,3}){3})$/i;

/**
 * Chat & WhatsApp links ALWAYS use https://merncrest.lk — never dev/staging IP URLs.
 * (Other app areas may use getPublicSiteOrigin() with env override.)
 */
export function getChatSiteOrigin(): string {
  return PUBLIC_SITE_ORIGIN;
}

/** @deprecated Prefer getChatSiteOrigin for live chat; kept for non-chat surfaces. */
export function getPublicSiteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || PUBLIC_SITE_ORIGIN).replace(/\/$/, "");
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (LOCAL_HOST_RE.test(host) || host.endsWith(".local")) {
      return PUBLIC_SITE_ORIGIN;
    }
    return raw;
  } catch {
    return PUBLIC_SITE_ORIGIN;
  }
}

/** Links shared in live chat / Aira replies — always merncrest.lk */
export function publicSiteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getChatSiteOrigin()}${p}`;
}

/** Rewrite localhost / IP URLs in text to the public merncrest.lk domain. */
export function rewriteLocalUrlsInText(text: string): string {
  if (!text) return text;

  return text
    .replace(
      /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(\/[^\s)\]"']*)?/gi,
      (_, path = "") => `${PUBLIC_SITE_ORIGIN}${path}`
    )
    .replace(
      /\b(?:localhost|127\.0\.0\.1)(?::\d+)?(\/[^\s)\]"']*)?/gi,
      (_, path = "") => `${PUBLIC_SITE_ORIGIN}${path || ""}`
    );
}

export function isLocalOrIpHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  return LOCAL_HOST_RE.test(h) || h.endsWith(".local");
}
