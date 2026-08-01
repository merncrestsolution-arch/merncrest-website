import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPostSlugs, getAllArticleSlugs, getAllCaseStudySlugs } from "@/lib/cms";
import { getAllOfferSlugs } from "@/lib/offers";
import { priceBookCatalog } from "@/lib/data/price-book";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://merncrest.lk").replace(/\/$/, "");

/** Static public marketing routes (locale prefix added per-locale below). */
const STATIC_PATHS = [
  "",
  "/about",
  "/services",
  "/solutions",
  "/products",
  "/industries",
  "/pricing",
  "/services/price-book",
  ...priceBookCatalog.map((e) => e.href),
  "/portfolio",
  "/support",
  "/contact",
  "/knowledge-base",
  "/blog",
  "/downloads",
  "/careers",
  "/partners",
  "/hosting",
  "/domains",
  "/cloud",
  "/login",
  "/register",
];

function localizedEntries(path: string, opts?: Partial<MetadataRoute.Sitemap[number]>) {
  return routing.locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: new Date(),
    ...opts,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [postSlugs, articleSlugs, caseStudySlugs, offerSlugs] = await Promise.all([
    getAllPostSlugs().catch(() => [] as string[]),
    getAllArticleSlugs().catch(() => [] as string[]),
    getAllCaseStudySlugs().catch(() => [] as string[]),
    getAllOfferSlugs().catch(() => [] as string[]),
  ]);

  const staticEntries = STATIC_PATHS.flatMap((p) =>
    localizedEntries(p, { changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 })
  );

  const blogEntries = postSlugs.flatMap((slug) =>
    localizedEntries(`/blog/${slug}`, { changeFrequency: "monthly", priority: 0.6 })
  );

  const kbEntries = articleSlugs.flatMap((slug) =>
    localizedEntries(`/knowledge-base/${slug}`, { changeFrequency: "monthly", priority: 0.5 })
  );

  const caseStudyEntries = caseStudySlugs.flatMap((slug) =>
    localizedEntries(`/portfolio/${slug}`, { changeFrequency: "monthly", priority: 0.6 })
  );

  const offerEntries = offerSlugs.flatMap((slug) =>
    localizedEntries(`/offers/${slug}`, { changeFrequency: "weekly", priority: 0.8 })
  );

  return [...staticEntries, ...blogEntries, ...kbEntries, ...caseStudyEntries, ...offerEntries];
}
