import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import {
  formatPackagePrice,
  priceBookVolumes,
  type PriceBookPackage,
  type PriceBookService,
} from "@/lib/data/price-book";

export type MatchedPriceBookItem = {
  service: PriceBookService;
  volumeTitle: string;
  pkg: PriceBookPackage;
  score: number;
};

const QUOTE_FORM_TYPES = new Set([
  "quote",
  "pricing",
  "pricing-quote",
  "services",
  "solutions",
  "enterprise-support",
  "branding",
  "websites",
  "mobile-apps",
  "pos",
  "erp",
  "business-systems",
  "ai-automation",
  "cloud-infrastructure",
  "marketing",
]);

export function isQuoteRequestForm(formType?: string | null) {
  if (!formType) return false;
  const key = formType.toLowerCase().replace(/^web:/, "");
  return QUOTE_FORM_TYPES.has(key) || key.includes("quote") || key.includes("pricing");
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreMatch(interest: string, service: PriceBookService, volumeTitle: string) {
  const tokens = tokenize(interest);
  if (!tokens.length) return 0;
  const haystack = `${service.name} ${service.slug} ${volumeTitle}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 2;
    if (service.slug.includes(token)) score += 3;
    if (service.name.toLowerCase().includes(token)) score += 4;
  }
  if (interest.toLowerCase().includes(service.slug.replace(/-/g, " "))) score += 6;
  if (interest.toLowerCase().includes(service.name.toLowerCase())) score += 8;
  return score;
}

export function matchPriceBookService(interest?: string | null): MatchedPriceBookItem | null {
  if (!interest?.trim()) return null;
  let best: MatchedPriceBookItem | null = null;
  for (const volume of priceBookVolumes) {
    for (const service of volume.services) {
      const score = scoreMatch(interest, service, volume.title);
      if (!best || score > best.score) {
        const pkg =
          service.packages.find((p) => p.tier === "basic") ||
          service.packages.find((p) => p.priceLkr > 0) ||
          service.packages[0];
        if (pkg) best = { service, volumeTitle: volume.title, pkg, score };
      }
    }
  }
  return best && best.score >= 2 ? best : null;
}

function packageToCents(pkg: PriceBookPackage) {
  if (pkg.priceLkr > 0) return pkg.priceLkr * 100;
  return 0;
}

function buildLineDescription(match: MatchedPriceBookItem | null, interest?: string | null) {
  if (match) {
    const priceLabel = formatPackagePrice(match.pkg);
    return `${match.service.name} (${match.pkg.label} — ${priceLabel})`;
  }
  return interest?.trim() || "MernCrest professional services — scope to be confirmed";
}

export async function createDraftQuotationFromLead(opts: {
  leadId: string;
  customerName: string;
  customerEmail: string;
  company?: string | null;
  interest?: string | null;
  message?: string | null;
  userId?: string | null;
  valueCents?: number;
}) {
  const existing = await prisma.quotation.findFirst({
    where: {
      leadId: opts.leadId,
      status: { in: ["PENDING_REVIEW", "DRAFT"] },
    },
  });
  if (existing) return existing;

  const match = matchPriceBookService(opts.interest);
  const unitPriceCents =
    opts.valueCents && opts.valueCents > 0
      ? opts.valueCents
      : match
        ? packageToCents(match.pkg)
        : 0;

  const description = buildLineDescription(match, opts.interest);
  const quantity = 1;
  const totalCents = unitPriceCents * quantity;
  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const notes = [
    "[AUTO-GENERATED — pending staff review]",
    match ? `Matched price book: ${match.volumeTitle} · ${match.service.name}` : null,
    opts.message?.trim() ? `Customer message: ${opts.message.trim()}` : null,
    unitPriceCents === 0 ? "Pricing to be confirmed by sales before sending." : null,
  ]
    .filter(Boolean)
    .join("\n");

  const quoteNumber = await nextOrgNumber("QUOTATION");
  const quote = await prisma.quotation.create({
    data: {
      quoteNumber,
      leadId: opts.leadId,
      userId: opts.userId || null,
      customerName: opts.customerName,
      customerEmail: opts.customerEmail,
      company: opts.company || null,
      subtotalCents: totalCents,
      taxCents: 0,
      discountCents: 0,
      totalCents,
      validUntil,
      terms:
        "Valid for 14 days. 50% advance for custom projects. Final pricing subject to scope confirmation.",
      notes,
      status: "PENDING_REVIEW",
      items: {
        create: [
          {
            description,
            quantity,
            unitPriceCents,
            totalCents,
          },
        ],
      },
    },
    include: { items: true },
  });

  await prisma.crmActivity.create({
    data: {
      leadId: opts.leadId,
      type: "STATUS",
      body: `Auto-generated draft quotation ${quote.quoteNumber} — awaiting staff review`,
    },
  });

  return quote;
}
