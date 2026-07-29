import type { BillingCycle } from "@prisma/client";
import { SL_TIMEZONE } from "@/lib/timezone";

type RenewalParams = {
  startDate: Date;
  freePeriodDays?: number;
  billingCycle: BillingCycle;
};

function getDatePartsInTimezone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function dateFromPartsInTimezone(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  timeZone: string
): Date {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  );
  const asSeen = getDatePartsInTimezone(utcGuess, timeZone);
  const desired = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const actual = Date.UTC(
    asSeen.year,
    asSeen.month - 1,
    asSeen.day,
    asSeen.hour,
    asSeen.minute,
    asSeen.second
  );
  return new Date(desired + (desired - actual));
}

function addCalendarDaysInTimezone(date: Date, days: number, timeZone: string): Date {
  const parts = getDatePartsInTimezone(date, timeZone);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  base.setUTCDate(base.getUTCDate() + days);
  return dateFromPartsInTimezone(
    {
      year: base.getUTCFullYear(),
      month: base.getUTCMonth() + 1,
      day: base.getUTCDate(),
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
    },
    timeZone
  );
}

function addMonthsInTimezone(
  date: Date,
  months: number,
  timeZone: string
): Date {
  const parts = getDatePartsInTimezone(date, timeZone);
  const targetMonthIndex = parts.month - 1 + months;
  const targetYear = parts.year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(parts.day, lastDay);
  return dateFromPartsInTimezone(
    {
      year: targetYear,
      month: targetMonth + 1,
      day,
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
    },
    timeZone
  );
}

function addBillingCycleInTimezone(date: Date, billingCycle: BillingCycle, timeZone: string): Date {
  switch (billingCycle) {
    case "MONTHLY":
      return addMonthsInTimezone(date, 1, timeZone);
    case "QUARTERLY":
      return addMonthsInTimezone(date, 3, timeZone);
    case "ANNUAL":
      return addMonthsInTimezone(date, 12, timeZone);
    case "ONE_TIME":
      return date;
    default: {
      const exhaustive: never = billingCycle;
      return exhaustive;
    }
  }
}

/**
 * Computes renewal date: startDate + freePeriodDays + one billing cycle, in Sri Lanka time (UTC+5:30).
 */
export function calculateRenewalDate(params: RenewalParams): Date {
  const { startDate, freePeriodDays = 0, billingCycle } = params;
  const afterFreePeriod = addCalendarDaysInTimezone(startDate, freePeriodDays, SL_TIMEZONE);
  return addBillingCycleInTimezone(afterFreePeriod, billingCycle, SL_TIMEZONE);
}

export type ServiceDates = {
  renewalDate: Date;
  expiryDate: Date;
  nextBillingDate: Date;
};

/**
 * Computes renewal, expiry, and next billing dates for a service lifecycle.
 * Expiry aligns with renewal; next billing is the start of the paid period after free period.
 */
export function calculateServiceDates(params: RenewalParams): ServiceDates {
  const { startDate, freePeriodDays = 0, billingCycle } = params;
  const afterFreePeriod = addCalendarDaysInTimezone(startDate, freePeriodDays, SL_TIMEZONE);
  const renewalDate = addBillingCycleInTimezone(afterFreePeriod, billingCycle, SL_TIMEZONE);
  return {
    renewalDate,
    expiryDate: renewalDate,
    nextBillingDate: afterFreePeriod,
  };
}

export const FREE_PERIOD_PRESETS = [
  { label: "No free period", days: 0 },
  { label: "3 months free", days: 90 },
  { label: "6 months free", days: 182 },
  { label: "12 months free", days: 365 },
] as const;

export const FREE_PERIOD_CUSTOM = "custom" as const;

/** Resolve preset or custom free-period input to a day count. */
export function resolveFreePeriodDays(preset: string, customDays?: string | number | null): number {
  if (preset === FREE_PERIOD_CUSTOM) {
    const n = typeof customDays === "number" ? customDays : Number(customDays);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.floor(n), 3650);
  }
  const n = Number(preset);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
