/** Sri Lanka timezone (UTC+5:30) helpers for billing and display. */
export const SL_TIMEZONE = "Asia/Colombo";

export function nowInSriLanka(): Date {
  return new Date();
}

export function formatSriLankaDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-LK", {
    timeZone: SL_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function formatSriLankaDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-LK", {
    timeZone: SL_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
