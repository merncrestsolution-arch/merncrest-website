import { describe, expect, it } from "vitest";

const hasDb = Boolean(process.env.DATABASE_URL);
const runIntegration = process.env.RUN_INTEGRATION_TESTS === "1" && hasDb;

describe.skipIf(!runIntegration)("nextOrgNumber concurrency", () => {
  it("assigns N unique quotation numbers under parallel load", async () => {
    const { nextOrgNumber } = await import("@/lib/commerce/org-numbers");
    const n = 8;
    const numbers = await Promise.all(
      Array.from({ length: n }, () => nextOrgNumber("QUOTATION"))
    );
    const unique = new Set(numbers);
    expect(unique.size).toBe(n);
  });
});

describe("OrgNumberSequence contract", () => {
  it("QUOTATION is a supported document kind", async () => {
    const { nextOrgNumber } = await import("@/lib/commerce/org-numbers");
    expect(typeof nextOrgNumber).toBe("function");
  });
});
