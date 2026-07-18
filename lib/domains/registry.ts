/** Mock domain registry — replace with real registrar API later. */

const RESERVED = new Set([
  "google",
  "facebook",
  "microsoft",
  "apple",
  "amazon",
  "merncrest",
  "localhost",
  "example",
]);

const TLD_PRICES_CENTS: Record<string, number> = {
  com: 250000,
  net: 280000,
  org: 280000,
  lk: 450000,
  info: 220000,
  io: 650000,
};

export function normalizeDomainInput(input: string) {
  const cleaned = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const parts = cleaned.split(".").filter(Boolean);
  if (parts.length < 2) {
    return { sld: parts[0] || "", tld: "com", fqdn: parts[0] ? `${parts[0]}.com` : "" };
  }
  const tld = parts.slice(1).join(".");
  const sld = parts[0];
  return { sld, tld, fqdn: `${sld}.${tld}` };
}

export function searchDomainAvailability(query: string) {
  const { sld, tld, fqdn } = normalizeDomainInput(query);
  if (!sld || sld.length < 2) {
    return { error: "Enter at least 2 characters", results: [] as ReturnType<typeof buildResult>[] };
  }

  const tlds = tld ? [tld, ...Object.keys(TLD_PRICES_CENTS).filter((t) => t !== tld)].slice(0, 6) : Object.keys(TLD_PRICES_CENTS);

  const results = tlds.map((t) => buildResult(sld, t));
  return { fqdn, sld, results };
}

function buildResult(sld: string, tld: string) {
  const available = !RESERVED.has(sld) && !/[^a-z0-9-]/i.test(sld) && !sld.startsWith("-");
  const priceCents = TLD_PRICES_CENTS[tld] ?? 300000;
  return {
    domain: `${sld}.${tld}`,
    sld,
    tld,
    available,
    priceCents,
    currency: "LKR",
    billingPeriod: "YEARLY" as const,
  };
}

export { TLD_PRICES_CENTS };
