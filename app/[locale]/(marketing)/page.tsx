import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { ServicesSection } from "@/components/sections/services-section";
import { SolutionsSection } from "@/components/sections/solutions-section";
import { TechnologiesSection } from "@/components/sections/technologies-section";
import { PortfolioSection } from "@/components/sections/portfolio-section";
import { StatsSection } from "@/components/sections/stats-section";
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
      siteName: "MERNcrest Solutions",
      locale: locale === "en" ? "en_US" : locale === "ta" ? "ta_LK" : "si_LK",
      type: "website",
    },
    alternates: {
      canonical: "https://merncrest.lk",
      languages: {
        en: "/en",
        ta: "/ta",
        si: "/si",
      },
    },
  };
}

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
      <AboutSection />
      <ServicesSection />
      <SolutionsSection />
      <TechnologiesSection />
      <PortfolioSection />
      <StatsSection />
      <TestimonialsSection />
      <BlogSection />
      <CTASection />
    </>
  );
}
