export type PriceBookPackageTier = "basic" | "professional" | "enterprise";

export type PriceBookPackage = {
  tier: PriceBookPackageTier;
  label: string;
  priceLkr: number;
  /** Suffix e.g. "+" for "LKR 500,000+" */
  priceSuffix?: string;
  /** e.g. "month", "year", "hour", "day" for recurring or unit pricing */
  priceNote?: string;
  /** Overrides formatted price e.g. "Next Business Day", "Unlimited (AMC)" */
  priceDisplay?: string;
};

export type PriceBookTierIncludes = {
  tier: PriceBookPackageTier;
  label: string;
  items: string[];
};

export type PriceBookService = {
  /** Master price book service number */
  serviceNumber: number;
  slug: string;
  name: string;
  packages: PriceBookPackage[];
  /** Flat list when the same across all tiers */
  includes?: string[];
  /** Per-tier breakdown when tiers differ */
  tierIncludes?: PriceBookTierIncludes[];
  /** Features or "suitable for" bullets */
  features?: string[];
  delivery?: string;
  warranty?: string;
  /** Footnote e.g. ad budget billed separately */
  note?: string;
};

export type PriceBookAddOn = {
  name: string;
  /** Fixed LKR price, or null when priced as actual cost + markup */
  priceLkr: number | null;
  /** e.g. "Actual Cost + 15%", "2,500/page", "25,000+" */
  priceNote?: string;
};

export type PriceBookWarrantyRow = {
  serviceType: string;
  warranty: string;
};

export type PriceBookDeliveryTime = {
  serviceType: string;
  delivery: string;
};

export type PriceBookExtraSection = {
  title: string;
  items: PriceBookAddOn[];
  note?: string;
};

export type PriceBookSlaTarget = {
  priority: string;
  responseTime: string;
  resolution: string;
};

export type PriceBookBenefitsSection = {
  title: string;
  subtitle?: string;
  items: string[];
};

export type PriceBookAmc = {
  title?: string;
  includesLabel?: string;
  plans: PriceBookAddOn[];
  includes: string[];
};

export type PriceBookVolume = {
  id: string;
  title: string;
  subtitle: string;
  fiscalYear: string;
  /** Short category line shown under the title */
  category?: string;
  services: PriceBookService[];
  addOns: PriceBookAddOn[];
  deliveryTimes: PriceBookDeliveryTime[];
  paymentTerms: string[];
  warrantyAndSupport: string[];
  domainAndHosting?: PriceBookAddOn[];
  extraSections?: PriceBookExtraSection[];
  amc?: PriceBookAmc;
  warrantyTable?: PriceBookWarrantyRow[];
  warrantyCovers?: string[];
  warrantyExcludes?: string[];
  /** Column header for delivery table (default: Project Type) */
  deliveryTimeLabel?: string;
  /** Column header for warranty table (default: Service Type) */
  warrantyTypeLabel?: string;
  /** Monthly KPI / reporting deliverables for marketing volumes */
  kpiReporting?: string[];
  slaTargets?: PriceBookSlaTarget[];
  benefitsSection?: PriceBookBenefitsSection;
};
