import type { PriceBookAddOn, PriceBookPackage, PriceBookService, PriceBookVolume } from "./types";
import { volume01Branding } from "./volume-01-branding";
import { volume02Websites } from "./volume-02-websites";
import { volume03Mobile } from "./volume-03-mobile";
import { volume04Pos } from "./volume-04-pos";
import { volume05Erp } from "./volume-05-erp";
import { volume06BusinessSystems } from "./volume-06-business-systems";
import { volume07Ai } from "./volume-07-ai";
import { volume08Cloud } from "./volume-08-cloud";
import { volume09Marketing } from "./volume-09-marketing";
import { volume10Support } from "./volume-10-support";

export type {
  PriceBookAddOn,
  PriceBookAmc,
  PriceBookBenefitsSection,
  PriceBookExtraSection,
  PriceBookPackage,
  PriceBookService,
  PriceBookSlaTarget,
  PriceBookTierIncludes,
  PriceBookVolume,
  PriceBookWarrantyRow,
} from "./types";
export {
  volume01Branding,
  volume02Websites,
  volume03Mobile,
  volume04Pos,
  volume05Erp,
  volume06BusinessSystems,
  volume07Ai,
  volume08Cloud,
  volume09Marketing,
  volume10Support,
};
export {
  priceBookCatalog,
  priceBookExecutiveSummary,
} from "./catalog";

export const priceBookVolumes: PriceBookVolume[] = [
  volume01Branding,
  volume02Websites,
  volume03Mobile,
  volume04Pos,
  volume05Erp,
  volume06BusinessSystems,
  volume07Ai,
  volume08Cloud,
  volume09Marketing,
  volume10Support,
];

export function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString("en-LK")}`;
}

export function formatPackagePrice(pkg: PriceBookPackage) {
  if (pkg.priceDisplay) return pkg.priceDisplay;
  const base = formatLkr(pkg.priceLkr);
  const period =
    pkg.priceNote === "month"
      ? "/month"
      : pkg.priceNote === "year"
        ? "/year"
        : pkg.priceNote === "hour"
          ? "/hour"
          : pkg.priceNote === "day"
            ? "/day"
            : "";
  const suffix = pkg.priceSuffix ?? "";
  return `${base}${suffix}${period}`;
}

export function formatAddOnPrice(addOn: PriceBookAddOn) {
  if (addOn.priceNote === "Free" || addOn.priceLkr === 0) return "Free";
  if (addOn.priceLkr == null) return addOn.priceNote ?? "—";
  const base = formatLkr(addOn.priceLkr);
  if (addOn.priceNote === "From") return `From ${base}`;
  if (addOn.priceNote?.startsWith("/")) return `${base}${addOn.priceNote}`;
  if (addOn.priceNote === "year") return `${base}/year`;
  if (addOn.priceNote === "month") return `${base}/month`;
  if (addOn.priceNote === "hour") return `${base}/hour`;
  if (addOn.priceNote) return addOn.priceNote;
  return base;
}

export function lkrToCents(amount: number) {
  return amount * 100;
}

export function getPriceBookService(slug: string): PriceBookService | undefined {
  for (const volume of priceBookVolumes) {
    const match = volume.services.find((s) => s.slug === slug);
    if (match) return match;
  }
  return undefined;
}

function serviceDetailLine(service: PriceBookService): string {
  const tiers = service.packages.map((p) => `${p.label} ${formatPackagePrice(p)}`).join(" · ");
  const parts = [`- Service ${service.serviceNumber} ${service.name}: ${tiers}`];
  if (service.includes?.length) parts.push(`Includes: ${service.includes.join(", ")}`);
  if (service.features?.length) parts.push(`Features: ${service.features.join(", ")}`);
  if (service.delivery) parts.push(`Delivery: ${service.delivery}`);
  if (service.warranty) parts.push(`Warranty: ${service.warranty}`);
  return parts.join(". ") + ".";
}

/** Flat catalog lines for AI chat and CRM reference. */
export function getPriceBookCatalogLines(): string[] {
  const lines: string[] = [];
  for (const volume of priceBookVolumes) {
    lines.push(`[${volume.title} — ${volume.fiscalYear}]`);
    for (const service of volume.services) {
      lines.push(serviceDetailLine(service));
    }
    if (volume.addOns.length) {
      const addOns = volume.addOns.map((a) => `${a.name} ${formatAddOnPrice(a)}`).join("; ");
      lines.push(`Add-ons: ${addOns}`);
    }
    for (const section of volume.extraSections ?? []) {
      const items = section.items.map((a) => `${a.name} ${formatAddOnPrice(a)}`).join("; ");
      lines.push(`${section.title}: ${items}`);
    }
  }
  return lines;
}
