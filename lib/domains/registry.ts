/** Mock domain registry — replace with real registrar API adapters later. */

const RESERVED = new Set([
  "google",
  "facebook",
  "microsoft",
  "apple",
  "amazon",
  "merncrest",
  "localhost",
  "example",
  "gov",
]);

/** priceCents: register / renew / transfer (yearly) */
export type TldPricing = {
  register: number;
  renew: number;
  transfer: number;
  premium?: boolean;
};

export const TLD_CATALOG: Record<string, TldPricing> = {
  // Sri Lanka
  lk: { register: 590000, renew: 590000, transfer: 450000 },
  "com.lk": { register: 490000, renew: 490000, transfer: 390000 },
  "org.lk": { register: 490000, renew: 490000, transfer: 390000 },
  "edu.lk": { register: 390000, renew: 390000, transfer: 350000 },
  "sch.lk": { register: 350000, renew: 350000, transfer: 300000 },
  "ngo.lk": { register: 450000, renew: 450000, transfer: 400000 },
  "hotel.lk": { register: 550000, renew: 550000, transfer: 500000 },
  "soc.lk": { register: 450000, renew: 450000, transfer: 400000 },
  // International
  com: { register: 250000, renew: 280000, transfer: 220000 },
  net: { register: 280000, renew: 300000, transfer: 250000 },
  org: { register: 280000, renew: 300000, transfer: 250000 },
  biz: { register: 260000, renew: 280000, transfer: 240000 },
  info: { register: 220000, renew: 240000, transfer: 200000 },
  xyz: { register: 180000, renew: 200000, transfer: 160000 },
  co: { register: 420000, renew: 450000, transfer: 400000 },
  io: { register: 650000, renew: 700000, transfer: 600000 },
  app: { register: 480000, renew: 520000, transfer: 450000 },
  dev: { register: 480000, renew: 520000, transfer: 450000 },
  online: { register: 200000, renew: 220000, transfer: 180000 },
  store: { register: 350000, renew: 380000, transfer: 320000 },
  tech: { register: 320000, renew: 350000, transfer: 300000 },
};

const SUGGESTION_SUFFIXES = ["online", "lk", "app", "tech", "store", "hq", "pro"];

export function normalizeDomainInput(input: string) {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const parts = cleaned.split(".").filter(Boolean);
  if (parts.length < 2) {
    return { sld: parts[0] || "", tld: "com", fqdn: parts[0] ? `${parts[0]}.com` : "" };
  }
  // Support multi-part TLDs like com.lk
  const knownMulti = Object.keys(TLD_CATALOG)
    .filter((t) => t.includes("."))
    .sort((a, b) => b.length - a.length);
  for (const multi of knownMulti) {
    if (cleaned.endsWith(`.${multi}`) || cleaned === multi) {
      const sld = cleaned.slice(0, -(multi.length + 1));
      return { sld, tld: multi, fqdn: sld ? `${sld}.${multi}` : multi };
    }
  }
  const tld = parts.slice(1).join(".");
  const sld = parts[0];
  return { sld, tld, fqdn: `${sld}.${tld}` };
}

export function searchDomainAvailability(query: string) {
  const { sld, tld, fqdn } = normalizeDomainInput(query);
  if (!sld || sld.length < 2) {
    return {
      error: "Enter at least 2 characters",
      results: [] as ReturnType<typeof buildResult>[],
      suggestions: [] as ReturnType<typeof buildResult>[],
    };
  }

  const allTlds = Object.keys(TLD_CATALOG);
  const preferred = tld && TLD_CATALOG[tld] ? tld : "com";
  const tlds = [
    preferred,
    ...allTlds.filter((t) => t !== preferred),
  ].slice(0, 12);

  const results = tlds.map((t) => buildResult(sld, t));
  const suggestions = SUGGESTION_SUFFIXES.filter((sfx) => sfx !== sld)
    .slice(0, 4)
    .map((sfx) => buildResult(`${sld}${sfx}`, preferred === "lk" ? "lk" : "com"));

  return { fqdn, sld, results, suggestions };
}

function buildResult(sld: string, tld: string) {
  const pricing = TLD_CATALOG[tld] ?? { register: 300000, renew: 320000, transfer: 280000 };
  const available =
    !RESERVED.has(sld) &&
    !/[^a-z0-9-]/i.test(sld) &&
    !sld.startsWith("-") &&
    !sld.endsWith("-");

  return {
    domain: `${sld}.${tld}`,
    sld,
    tld,
    available,
    premium: Boolean(pricing.premium),
    priceCents: pricing.register,
    renewPriceCents: pricing.renew,
    transferPriceCents: pricing.transfer,
    currency: "LKR",
    billingPeriod: "YEARLY" as const,
  };
}

/** @deprecated use TLD_CATALOG */
export const TLD_PRICES_CENTS = Object.fromEntries(
  Object.entries(TLD_CATALOG).map(([k, v]) => [k, v.register])
);
