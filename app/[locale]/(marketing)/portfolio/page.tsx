import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { ArrowRight } from "lucide-react";
import { PortfolioGrid } from "@/components/sections/portfolio-grid";
import { getPublishedCaseStudies } from "@/lib/cms";
import { caseStudyToCard } from "@/lib/portfolio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const title = `${t("portfolio")} | MernCrest Solutions`;
  const description =
    "Case studies of MernCrest client work across software engineering, cloud, and AI.";
  return {
    title,
    description,
    alternates: { canonical: "https://merncrest.lk/portfolio" },
    openGraph: { title, description, url: "https://merncrest.lk/portfolio", type: "website" },
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("portfolioPage");

  const studies = await getPublishedCaseStudies();
  const projects = studies.map(caseStudyToCard);

  return (
    <div className="stitch-page">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <div className="stitch-page-body stitch-stack-lg">
        <PortfolioGrid projects={projects} />

        <div className="stitch-card text-center !py-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" aria-hidden />
          <div className="relative z-10 stitch-stack-md max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t("ctaTitle")}
            </h2>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/contact">
                {t("ctaButton")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
