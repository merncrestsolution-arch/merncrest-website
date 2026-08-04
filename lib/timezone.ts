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

function slCalendarParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/** Midnight on the calendar day in Sri Lanka (for attendance workDate). */
export function startOfDaySriLanka(date = new Date()): Date {
  const p = slCalendarParts(date);
  const iso = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}T00:00:00+05:30`;
  return new Date(iso);
}

export function isLateInSriLanka(date = new Date(), afterHour = 9, afterMinute = 15): boolean {
  const p = slCalendarParts(date);
  return p.hour > afterHour || (p.hour === afterHour && p.minute > afterMinute);
}
