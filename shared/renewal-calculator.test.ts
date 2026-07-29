import { describe, it, expect } from "vitest";
import { calculateRenewalDate } from "./renewal-calculator";

describe("calculateRenewalDate", () => {
  it("adds one annual billing cycle with no free period", () => {
    const startDate = new Date("2026-01-15T10:00:00.000Z");
    const renewal = calculateRenewalDate({
      startDate,
      billingCycle: "ANNUAL",
    });
    expect(renewal.getUTCFullYear()).toBe(2027);
    expect(renewal.getUTCMonth()).toBe(0);
    expect(renewal.getUTCDate()).toBe(15);
  });

  it("adds free period days then monthly billing cycle", () => {
    const startDate = new Date("2026-03-01T00:00:00.000Z");
    const renewal = calculateRenewalDate({
      startDate,
      freePeriodDays: 14,
      billingCycle: "MONTHLY",
    });
    // 14 days free from Mar 1 → Mar 15, then +1 month → Apr 15
    expect(renewal.getUTCFullYear()).toBe(2026);
    expect(renewal.getUTCMonth()).toBe(3);
    expect(renewal.getUTCDate()).toBe(15);
  });

  it("adds free period days then annual billing cycle", () => {
    const startDate = new Date("2026-06-01T12:00:00.000Z");
    const renewal = calculateRenewalDate({
      startDate,
      freePeriodDays: 30,
      billingCycle: "ANNUAL",
    });
    // 30 days from Jun 1 → Jul 1, then +1 year → Jul 1 2027
    expect(renewal.getUTCFullYear()).toBe(2027);
    expect(renewal.getUTCMonth()).toBe(6);
    expect(renewal.getUTCDate()).toBe(1);
  });

  it("handles timezone edge case near midnight UTC+5:30", () => {
    // 2026-01-15 18:30 UTC = 2026-01-16 00:00 in Sri Lanka
    const startDate = new Date("2026-01-15T18:30:00.000Z");
    const renewal = calculateRenewalDate({
      startDate,
      freePeriodDays: 0,
      billingCycle: "MONTHLY",
    });
    // SL local is Jan 16 00:00 + 1 month = Feb 16 00:00 SL = Feb 15 18:30 UTC
    expect(renewal.toISOString()).toBe("2026-02-15T18:30:00.000Z");
  });

  it("returns same date for ONE_TIME billing cycle after free period", () => {
    const startDate = new Date("2026-04-10T08:00:00.000Z");
    const renewal = calculateRenewalDate({
      startDate,
      freePeriodDays: 7,
      billingCycle: "ONE_TIME",
    });
    expect(renewal.getUTCFullYear()).toBe(2026);
    expect(renewal.getUTCMonth()).toBe(3);
    expect(renewal.getUTCDate()).toBe(17);
  });

  it("adds quarterly billing cycle", () => {
    const startDate = new Date("2026-01-01T00:00:00.000Z");
    const renewal = calculateRenewalDate({
      startDate,
      billingCycle: "QUARTERLY",
    });
    expect(renewal.getUTCFullYear()).toBe(2026);
    expect(renewal.getUTCMonth()).toBe(3);
    expect(renewal.getUTCDate()).toBe(1);
  });
});
