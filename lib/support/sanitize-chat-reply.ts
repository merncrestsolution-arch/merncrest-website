import {
  PUBLIC_SITE_ORIGIN,
  rewriteLocalUrlsInText,
} from "@/lib/support/public-site-url";

/** Standalone IPv4 — not embedded in domain names like merncrest.lk */
const STANDALONE_IPV4_RE =
  /(?<![\w./-])(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})(?![\w.])/g;

const IPV6_RE = /\b(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}\b/gi;

const IP_PHRASE_RE =
  /\b(your ip(?:\s+address)?|client ip|visitor ip|ip address is|detected ip|from ip|ip is)\b[^.\n]{0,120}/gi;

/** Bare localhost / IP host mentions without scheme */
const BARE_LOCAL_HOST_RE =
  /\b(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/[^\s]*)?/gi;

const SAFE_FALLBACK =
  "Thanks for reaching out! I'd love to help you find the right solution. " +
  "Could you tell me a bit about your business and what you're looking to achieve — " +
  "website, ERP, mobile app, cloud, or hosting? " +
  `Explore our services: ${PUBLIC_SITE_ORIGIN}/services`;

/**
 * Clean AI/staff/system chat replies for visitors:
 * - Rewrite localhost/IP URLs → https://merncrest.lk
 * - Strip leaked visitor/server IPs
 */
export function sanitizeChatReply(text: string): string {
  if (!text?.trim()) return text;

  let out = rewriteLocalUrlsInText(text)
    .replace(BARE_LOCAL_HOST_RE, PUBLIC_SITE_ORIGIN)
    .replace(IP_PHRASE_RE, "")
    .replace(/\bClientIp:\s*\S+/gi, "")
    .replace(STANDALONE_IPV4_RE, "")
    .replace(IPV6_RE, "")
    // Fix broken URLs after IP strip (e.g. http://:3000/path)
    .replace(/https?:\/\/:(\d+)?/gi, PUBLIC_SITE_ORIGIN)
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Ensure merncrest links always use https public domain
  out = out.replace(
    /https?:\/\/(?:www\.)?merncrest\.lk/gi,
    PUBLIC_SITE_ORIGIN
  );

  if (!out || out.length < 12) {
    return SAFE_FALLBACK;
  }

  return out;
}

export function replyContainsLeakedIp(text: string): boolean {
  return (
    STANDALONE_IPV4_RE.test(text) ||
    IPV6_RE.test(text) ||
    IP_PHRASE_RE.test(text) ||
    BARE_LOCAL_HOST_RE.test(text) ||
    /https?:\/\/(?:localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})/i.test(text)
  );
}
