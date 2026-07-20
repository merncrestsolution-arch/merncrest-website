import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/hero-section";
import { TrustPartnersSection } from "@/components/sections/trust-partners-section";
import { FeaturedServicesSection } from "@/components/sections/featured-services-section";
import { MarketplaceTeaserSection } from "@/components/sections/marketplace-teaser-section";
import { PlatformSection } from "@/components/sections/platform-section";
import { PortfolioSection } from "@/components/sections/portfolio-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { BlogSection } from "@/components/sections/blog-section";
import { CTASection } from "@/components/sections/cta-section";

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

  return (
    <>
      <HeroSection />
      <TrustPartnersSection />
      <FeaturedServicesSection />
      <MarketplaceTeaserSection />
      <PlatformSection />
      <PortfolioSection />
      <TestimonialsSection />
      <BlogSection />
      <CTASection />
    </>
  );
}
