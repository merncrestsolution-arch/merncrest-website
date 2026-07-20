/**
 * Domain search facade.
 * Routes .lk → DomainLK · gTLDs → Namecheap via provider registry + Pricing Engine.
 */

import { PROVIDER_TLD_COST, normalizeDomainInput } from "@/lib/providers/mock-adapter";
import { isLkTld } from "@/lib/providers/domainlk-adapter";
import { getDomainSearchAdapter } from "@/lib/providers/registry";
import { priceFromProvider } from "@/lib/providers/pricing-engine";

export type TldPricing = {
  register: number;
  renew: number;
  transfer: number;
  premium?: boolean;
};

/** @deprecated Selling prices are now provider cost + margin; kept for WhatsApp fallbacks */
export const TLD_CATALOG: Record<string, TldPricing> = Object.fromEntries(
  Object.entries(PROVIDER_TLD_COST).map(([tld, c]) => [
    tld,
    {
      register: c.register + 30000,
      renew: c.renew + 30000,
      transfer: c.transfer + 30000,
      premium: c.premium,
    },
  ])
);

export { normalizeDomainInput };

export async function searchDomainAvailabilityAsync(query: string) {
  const { tld } = normalizeDomainInput(query);
  const hint = tld && PROVIDER_TLD_COST[tld] ? tld : undefined;
  // Prefer DomainLK when query is bare SLD + user likely wants .lk (Sri Lanka market)
  const tldHint = hint && isLkTld(hint) ? hint : hint || undefined;

  const { provider, adapter } = await getDomainSearchAdapter(tldHint);
  const raw = await adapter.searchDomains(query);
  if (raw.error) {
    return {
      error: raw.error,
      results: [] as Awaited<ReturnType<typeof enrichResult>>[],
      suggestions: [] as Awaited<ReturnType<typeof enrichResult>>[],
      provider: provider?.code ?? "mock-a",
    };
  }

  // If searching a gTLD, also pull a few .lk suggestions from DomainLK when available
  let crossSuggestions = raw.suggestions;
  if (tldHint && !isLkTld(tldHint) && raw.sld) {
    try {
      const lk = await getDomainSearchAdapter("lk");
      if (lk.provider && lk.provider.code !== provider?.code) {
        const lkRaw = await lk.adapter.searchDomains(`${raw.sld}.lk`);
        const lkHits = (lkRaw.results || [])
          .filter((r) => r.available)
          .slice(0, 2);
        crossSuggestions = [...lkHits, ...crossSuggestions].slice(0, 8);
      }
    } catch {
      /* ignore cross-provider soft-fail */
    }
  }

  const results = await Promise.all(raw.results.map(enrichResult));
  const suggestions = await Promise.all(crossSuggestions.map(enrichResult));

  return {
    fqdn: raw.fqdn,
    sld: raw.sld,
    results,
    suggestions,
    provider: provider?.code ?? "mock-a",
    providerId: provider?.id ?? null,
  };
}

async function enrichResult(r: {
  domain: string;
  sld: string;
  tld: string;
  available: boolean;
  premium?: boolean;
  providerPriceCents: number;
  renewProviderCents: number;
  transferProviderCents: number;
  currency: string;
}) {
  const cur = r.currency || "LKR";
  const register = await priceFromProvider(r.providerPriceCents, "domains", 0, cur);
  const renew = await priceFromProvider(r.renewProviderCents, "domains", 0, cur);
  const transfer = await priceFromProvider(r.transferProviderCents, "domains", 0, cur);
  return {
    domain: r.domain,
    sld: r.sld,
    tld: r.tld,
    available: r.available,
    premium: Boolean(r.premium),
    /** Customer-facing LKR selling price */
    priceCents: register.sellingPriceCents,
    renewPriceCents: renew.sellingPriceCents,
    transferPriceCents: transfer.sellingPriceCents,
    providerPriceCents: r.providerPriceCents,
    providerCurrency: cur,
    exchangeRate: register.exchangeRate,
    exchangeRateLockedAt: register.exchangeRateLockedAt.toISOString(),
    fxBufferPercent: register.fxBufferPercent,
    /** Selling currency for checkout / invoices */
    currency: "LKR",
    billingPeriod: "YEARLY" as const,
  };
}

/** Sync wrapper for legacy callers (WhatsApp). Prefer searchDomainAvailabilityAsync. */
export function searchDomainAvailability(query: string) {
  const { sld, tld, fqdn } = normalizeDomainInput(query);
  if (!sld || sld.length < 2) {
    return {
      error: "Enter at least 2 characters",
      results: [] as ReturnType<typeof buildLegacyResult>[],
      suggestions: [] as ReturnType<typeof buildLegacyResult>[],
    };
  }

  const allTlds = Object.keys(TLD_CATALOG);
  const preferred = tld && TLD_CATALOG[tld] ? tld : "com";
  const tlds = [preferred, ...allTlds.filter((t) => t !== preferred)].slice(0, 12);
  const results = tlds.map((t) => buildLegacyResult(sld, t));
  const primaryUnavailable = results[0] && !results[0].available;
  const suggestions = ["online", "lk", "app", "tech", "store", "hq", "pro"]
    .filter((sfx) => sfx !== sld)
    .slice(0, primaryUnavailable ? 6 : 4)
    .map((sfx) => buildLegacyResult(`${sld}${sfx}`, preferred === "lk" ? "lk" : "com"))
    .filter((r) => r.available);

  return { fqdn, sld, results, suggestions };
}

function buildLegacyResult(sld: string, tld: string) {
  const pricing = TLD_CATALOG[tld] ?? { register: 300000, renew: 320000, transfer: 280000 };
  const cost = PROVIDER_TLD_COST[tld];
  const available =
    !["google", "facebook", "microsoft", "apple", "amazon", "merncrest", "localhost", "example", "gov"].includes(
      sld
    ) &&
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
    providerPriceCents: cost?.register,
    currency: "LKR",
    billingPeriod: "YEARLY" as const,
  };
}

/** @deprecated use TLD_CATALOG */
export const TLD_PRICES_CENTS = Object.fromEntries(
  Object.entries(TLD_CATALOG).map(([k, v]) => [k, v.register])
);
