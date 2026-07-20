import type { MarginCategory } from "@/lib/providers/types";
import { prisma } from "@/lib/db";
import { convertToLkrCents, lockFxQuote, type FxQuote } from "@/lib/providers/fx";

export type MarginMode = "FIXED" | "PERCENT" | "BOTH";

export type MarginConfig = {
  category: MarginCategory;
  marginCents: number;
  marginPercent: number;
  marginMode: MarginMode;
  fxBufferPercent: number;
};

/**
 * Default margins.
 * - LKR categories (DomainLK etc.): FIXED flat LKR cents (unchanged for existing installs).
 * - USD-heavy categories: PERCENT so FX movement does not wipe flat-LKR margins.
 *
 * MIGRATION NOTE: Existing PricingMargin rows are NOT rewritten. `marginMode` defaults to
 * FIXED in the schema so stored marginCents/marginPercent keep historical behaviour.
 * Admins can switch to PERCENT in Admin → Pricing Margins without changing stored numbers.
 */
const DEFAULT_MARGINS: MarginConfig[] = [
  { category: "domains", marginCents: 30000, marginPercent: 15, marginMode: "FIXED", fxBufferPercent: 2 },
  { category: "hosting", marginCents: 300000, marginPercent: 20, marginMode: "FIXED", fxBufferPercent: 2 },
  { category: "vps", marginCents: 1000000, marginPercent: 20, marginMode: "FIXED", fxBufferPercent: 2 },
  { category: "ssl", marginCents: 100000, marginPercent: 25, marginMode: "FIXED", fxBufferPercent: 2 },
  { category: "email", marginCents: 50000, marginPercent: 20, marginMode: "FIXED", fxBufferPercent: 2 },
  { category: "cloud", marginCents: 1000000, marginPercent: 20, marginMode: "FIXED", fxBufferPercent: 2 },
];

/**
 * Pricing Engine (FX-safe)
 *
 * 1. Convert provider cost to LKR using locked exchange rate (+ FX buffer for USD)
 * 2. Apply margin per marginMode:
 *    - FIXED: + marginCents
 *    - PERCENT: + percent of LKR provider cost
 *    - BOTH: fixed + percent
 *
 * Selling currency is always LKR for customer invoices.
 */
export function calculateSellingPrice(
  providerPriceLkrCents: number,
  margin: Pick<MarginConfig, "marginCents" | "marginPercent" | "marginMode">,
  fallbackMarginCents = 0
) {
  const mode = margin.marginMode || "FIXED";
  const fixed =
    mode === "FIXED" || mode === "BOTH"
      ? margin.marginCents || fallbackMarginCents || 0
      : 0;
  const percentPart =
    (mode === "PERCENT" || mode === "BOTH") && margin.marginPercent > 0
      ? Math.round(providerPriceLkrCents * (margin.marginPercent / 100))
      : 0;
  // Legacy BOTH-compat: if mode is FIXED but percent is set and cents is 0, still apply percent
  // (preserves pre-marginMode behaviour where both fields were always additive)
  const legacyPercent =
    mode === "FIXED" && margin.marginPercent > 0 && !margin.marginCents
      ? Math.round(providerPriceLkrCents * (margin.marginPercent / 100))
      : mode === "FIXED" && margin.marginPercent > 0 && margin.marginCents
        ? Math.round(providerPriceLkrCents * (margin.marginPercent / 100))
        : 0;

  const addFixed = fixed;
  const addPercent = mode === "FIXED" ? legacyPercent : percentPart;

  return Math.max(0, providerPriceLkrCents + addFixed + addPercent);
}

export function mapCategoryToMargin(category: string): MarginCategory {
  const c = category.toLowerCase();
  if (c === "domains" || c === "domain") return "domains";
  if (c === "vps" || c.includes("vps")) return "vps";
  if (c === "ssl" || c === "security") return "ssl";
  if (c === "email") return "email";
  if (c === "cloud") return "cloud";
  if (c === "hosting") return "hosting";
  return "hosting";
}

function rowToConfig(row: {
  category: string;
  marginCents: number;
  marginPercent: number;
  marginMode?: string | null;
  fxBufferPercent?: number | null;
}): MarginConfig {
  const mode = (row.marginMode || "FIXED").toUpperCase() as MarginMode;
  return {
    category: row.category as MarginCategory,
    marginCents: row.marginCents,
    marginPercent: row.marginPercent,
    marginMode: ["FIXED", "PERCENT", "BOTH"].includes(mode) ? mode : "FIXED",
    fxBufferPercent: row.fxBufferPercent ?? 2,
  };
}

export async function getMarginsMap(): Promise<Map<MarginCategory, MarginConfig>> {
  const rows = await prisma.pricingMargin.findMany();
  const map = new Map<MarginCategory, MarginConfig>();
  for (const d of DEFAULT_MARGINS) map.set(d.category, d);
  for (const row of rows) {
    map.set(row.category as MarginCategory, rowToConfig(row));
  }
  return map;
}

export async function ensureDefaultMargins() {
  for (const m of DEFAULT_MARGINS) {
    await prisma.pricingMargin.upsert({
      where: { category: m.category },
      create: {
        category: m.category,
        marginCents: m.marginCents,
        marginPercent: m.marginPercent,
        marginMode: m.marginMode,
        fxBufferPercent: m.fxBufferPercent,
      },
      // Do not overwrite existing marginCents/percent/mode — migration-safe
      update: {},
    });
  }
}

export type PricedResult = {
  providerPriceCents: number;
  providerPriceLkrCents: number;
  sellingPriceCents: number;
  marginCents: number;
  category: MarginCategory;
  providerCurrency: string;
  exchangeRate: number;
  exchangeRateLockedAt: Date;
  fxBufferPercent: number;
  marginMode: MarginMode;
};

/**
 * Price a provider cost into LKR selling price.
 * @param providerPriceCents — in the provider's native currency units (cents)
 * @param providerCurrency — USD | LKR (default LKR for DomainLK / legacy)
 */
export async function priceFromProvider(
  providerPriceCents: number,
  category: string,
  fallbackMarginCents = 0,
  providerCurrency = "LKR"
): Promise<PricedResult> {
  const margins = await getMarginsMap();
  const key = mapCategoryToMargin(category);
  const margin = margins.get(key) ?? {
    category: key,
    marginCents: fallbackMarginCents,
    marginPercent: 0,
    marginMode: "FIXED" as MarginMode,
    fxBufferPercent: 2,
  };

  // New USD products default to percentage margin when category still FIXED with only flat LKR
  let effectiveMargin = margin;
  if (
    providerCurrency.toUpperCase() === "USD" &&
    margin.marginMode === "FIXED" &&
    margin.marginPercent > 0
  ) {
    // Prefer percent for USD quotes without mutating stored admin config
    effectiveMargin = { ...margin, marginMode: "PERCENT" };
  }

  const fx: FxQuote = await lockFxQuote(
    providerPriceCents,
    providerCurrency,
    effectiveMargin.fxBufferPercent
  );

  const sellingPriceCents = calculateSellingPrice(
    fx.providerPriceLkrCents,
    effectiveMargin,
    fallbackMarginCents
  );

  return {
    providerPriceCents,
    providerPriceLkrCents: fx.providerPriceLkrCents,
    sellingPriceCents,
    marginCents: sellingPriceCents - fx.providerPriceLkrCents,
    category: key,
    providerCurrency: fx.providerCurrency,
    exchangeRate: fx.exchangeRate,
    exchangeRateLockedAt: fx.exchangeRateLockedAt,
    fxBufferPercent: fx.fxBufferPercent,
    marginMode: effectiveMargin.marginMode,
  };
}

/** Reprice using an already-locked FX quote (checkout / order snapshot). */
export function priceFromLockedFx(
  providerPriceCents: number,
  providerCurrency: string,
  exchangeRate: number,
  fxBufferPercent: number,
  margin: Pick<MarginConfig, "marginCents" | "marginPercent" | "marginMode">,
  fallbackMarginCents = 0
) {
  const lkr = convertToLkrCents(
    providerPriceCents,
    providerCurrency,
    exchangeRate,
    fxBufferPercent
  );
  const selling = calculateSellingPrice(lkr, margin, fallbackMarginCents);
  return {
    providerPriceLkrCents: lkr,
    sellingPriceCents: selling,
    marginCents: selling - lkr,
  };
}

export { DEFAULT_MARGINS };
