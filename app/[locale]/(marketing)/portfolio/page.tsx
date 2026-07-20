import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { ArrowRight } from "lucide-react";
import { PortfolioGrid } from "@/components/sections/portfolio-grid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("portfolio")} | MERNcrest Solutions`,
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Our Work"
        title="Case studies & projects"
        description="Explore a selection of our most impactful digital transformations across various industries worldwide."
      />

      <div className="stitch-page-body stitch-stack-lg">
        <PortfolioGrid />

        <div className="stitch-card text-center !py-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" aria-hidden />
          <div className="relative z-10 stitch-stack-md max-w-xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Have a project in mind?
            </h2>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/contact">
                Let&apos;s Build It Together <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
