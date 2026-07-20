/**
 * FX helpers for USD-denominated reseller costs → LKR selling currency.
 * Rate is locked at quote time and stored on cart/order line items.
 */

import { getSetting } from "@/lib/admin/settings";

const DEFAULT_USD_LKR = 320;
const DEFAULT_FX_BUFFER = 2;

/** Current USD→LKR mid rate (LKR per 1 USD). Prefer SystemSetting, then env. */
export async function getUsdLkrRate(): Promise<number> {
  const fromDb = await getSetting("fx.usdLkrRate");
  if (fromDb && Number(fromDb) > 0) return Number(fromDb);
  const fromEnv = Number(process.env.NAMECHEAP_USD_LKR_RATE || DEFAULT_USD_LKR);
  return fromEnv > 0 ? fromEnv : DEFAULT_USD_LKR;
}

export async function getDefaultFxBufferPercent(): Promise<number> {
  const fromDb = await getSetting("fx.defaultBufferPercent");
  if (fromDb != null && fromDb !== "" && Number(fromDb) >= 0) return Number(fromDb);
  return DEFAULT_FX_BUFFER;
}

/**
 * Convert provider cost cents in `fromCurrency` to LKR cents.
 * Applies optional FX buffer (e.g. 2%) on top of the locked rate.
 */
export function convertToLkrCents(
  providerPriceCents: number,
  fromCurrency: string,
  exchangeRate: number,
  fxBufferPercent = 0
): number {
  const cur = (fromCurrency || "LKR").toUpperCase();
  if (cur === "LKR") return Math.max(0, Math.round(providerPriceCents));

  if (cur === "USD") {
    // providerPriceCents is USD cents (e.g. $12.00 → 1200)
    const usd = providerPriceCents / 100;
    const bufferedRate = exchangeRate * (1 + fxBufferPercent / 100);
    return Math.max(0, Math.round(usd * bufferedRate * 100));
  }

  // Unknown currency — treat as already LKR to avoid zeroing prices
  return Math.max(0, Math.round(providerPriceCents));
}

export type FxQuote = {
  providerCurrency: string;
  exchangeRate: number;
  exchangeRateLockedAt: Date;
  fxBufferPercent: number;
  providerPriceLkrCents: number;
};

/** Lock FX at quote time for a provider price. */
export async function lockFxQuote(
  providerPriceCents: number,
  providerCurrency: string,
  fxBufferPercent?: number
): Promise<FxQuote> {
  const cur = (providerCurrency || "LKR").toUpperCase();
  const rate = cur === "USD" ? await getUsdLkrRate() : 1;
  const buffer =
    fxBufferPercent != null
      ? fxBufferPercent
      : cur === "USD"
        ? await getDefaultFxBufferPercent()
        : 0;
  return {
    providerCurrency: cur,
    exchangeRate: rate,
    exchangeRateLockedAt: new Date(),
    fxBufferPercent: buffer,
    providerPriceLkrCents: convertToLkrCents(providerPriceCents, cur, rate, buffer),
  };
}
