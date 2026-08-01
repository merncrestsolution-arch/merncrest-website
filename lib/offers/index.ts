import { prisma } from "@/lib/db";
import type { PublicOffer } from "./types";

export type { PublicOffer } from "./types";
export { GRADIENT_THEMES } from "./types";

function parseFeatures(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((f) => typeof f === "string") : [];
  } catch {
    return [];
  }
}

function serializeOffer(row: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: string | null;
  badge: string | null;
  category: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  featuresJson: string | null;
  gradientTheme: string;
  ctaText: string;
  ctaUrl: string | null;
  priority: number;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
}): PublicOffer {
  return {
    ...row,
    features: parseFeatures(row.featuresJson),
  };
}

/** Published, enabled, non-expired offers for the homepage carousel. */
export async function getPublishedHomepageOffers(): Promise<PublicOffer[]> {
  const now = new Date();
  const rows = await prisma.homepageOffer.findMany({
    where: {
      status: "PUBLISHED",
      isEnabled: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: 50,
  });
  return rows.map(serializeOffer);
}

export async function getOfferBySlug(slug: string): Promise<PublicOffer | null> {
  const now = new Date();
  const row = await prisma.homepageOffer.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      isEnabled: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
  });
  return row ? serializeOffer(row) : null;
}

export async function getAllOfferSlugs(): Promise<string[]> {
  const now = new Date();
  const rows = await prisma.homepageOffer.findMany({
    where: {
      status: "PUBLISHED",
      isEnabled: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/** Mark offers past endDate as EXPIRED (called from admin list / cron). */
export async function expireStaleOffers(): Promise<number> {
  const now = new Date();
  const result = await prisma.homepageOffer.updateMany({
    where: {
      status: "PUBLISHED",
      endDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

export function featuresToJson(features: string[]): string {
  return JSON.stringify(features.filter(Boolean));
}
