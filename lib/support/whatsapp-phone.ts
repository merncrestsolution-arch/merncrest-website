/**
 * Sri Lanka–aware WhatsApp phone helpers.
 * Business line: 0713838638 → E.164 digits 94713838638
 */

export const MERNcrest_WA_DISPLAY = "0713838638";
export const MERNcrest_WA_E164 = "94713838638";
export const MERNcrest_WA_INTERNATIONAL = "+94713838638";

/** Digits only, Sri Lanka local 0xx → 94xx */
export function normalizeWhatsAppPhone(phone: string): string {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  // Strip leading 00 international prefix
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Local LK mobile: 07xxxxxxxx → 947xxxxxxxx
  if (digits.startsWith("0") && digits.length === 10) {
    digits = `94${digits.slice(1)}`;
  }
  // 9-digit without trunk: 7xxxxxxxx → 947xxxxxxxx
  if (digits.length === 9 && digits.startsWith("7")) {
    digits = `94${digits}`;
  }
  return digits;
}

export function whatsappClickToChatUrl(message?: string) {
  const text = message
    ? `?text=${encodeURIComponent(message)}`
    : "";
  return `https://wa.me/${MERNcrest_WA_E164}${text}`;
}

export function phoneMatchVariants(phone: string): string[] {
  const n = normalizeWhatsAppPhone(phone);
  if (!n) return [];
  const local = n.startsWith("94") ? `0${n.slice(2)}` : n;
  return [...new Set([phone, n, `+${n}`, local, `0${n.slice(2)}`])];
}
