import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";import { HeroSection } from "@/components/sections/hero-section";
import { TrustPartnersSection } from "@/components/sections/trust-partners-section";
import { FeaturedServicesSection } from "@/components/sections/featured-services-section";
import { MarketplaceTeaserSection } from "@/components/sections/marketplace-teaser-section";
import { PlatformSection } from "@/components/sections/platform-section";
import { StatsBandSection } from "@/components/sections/stats-band-section";
import { GroupsBrandsSection } from "@/components/sections/groups-brands-section";
import { CountriesFlagsSection } from "@/components/sections/countries-flags-section";
import { PortfolioSection } from "@/components/sections/portfolio-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { BlogSection } from "@/components/sections/blog-section";
import { CTASection } from "@/components/sections/cta-section";
import { getPublishedCaseStudies, getPublishedPosts } from "@/lib/cms";
import { formatBlogDate } from "@/lib/commerce-format";

export const revalidate = 300;

const getHomepageContent = unstable_cache(
  async () => {
    const [caseStudies, posts] = await Promise.all([
      getPublishedCaseStudies({ featured: true }),
      getPublishedPosts(),
    ]);
    return { caseStudies, posts };
  },
  ["homepage-cms"],
  { revalidate: 300 },
);
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://merncrest.lk",
      siteName: "MernCrest Solutions",
      locale: locale === "en" ? "en_US" : locale === "ta" ? "ta_LK" : "si_LK",
      type: "website",
    },
    alternates: {
      canonical: "https://merncrest.lk",
      languages: { en: "/en", ta: "/ta", si: "/si" },
    },
  };
}

/** Homepage composition matches Stitch screen: MernCrest - Homepage */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { caseStudies, posts } = await getHomepageContent();

  const featured = caseStudies.slice(0, 3).map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    category: s.industry || s.category,
    image: s.coverImageUrl,
    description: s.excerpt || s.problem,
  }));

  const latestPosts = posts.slice(0, 3).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    author: p.author,
    date: formatBlogDate(p.publishedAt ?? p.createdAt),
    category: p.category,
    image: p.coverImageUrl,
  }));

  return (
    <>
      <HeroSection />
      <TrustPartnersSection />
      <FeaturedServicesSection />
      <MarketplaceTeaserSection />
      <PlatformSection />
      <StatsBandSection />
      <GroupsBrandsSection />
      <CountriesFlagsSection />
      <PortfolioSection projects={featured} />
      <TestimonialsSection />
      <BlogSection posts={latestPosts} />
      <CTASection />
    </>
  );
}
