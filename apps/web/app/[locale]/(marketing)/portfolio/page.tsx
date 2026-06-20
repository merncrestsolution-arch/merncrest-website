import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
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
    <div className="container-wide section-padding pt-32 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
          Our Work
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 font-display text-balance">
          Case Studies & Projects
        </h1>
        <p className="text-muted text-lg">
          Explore a selection of our most impactful digital transformations across various industries worldwide.
        </p>
      </div>

      {/* Interactive Framer Motion Grid Component */}
      <PortfolioGrid />

      <div className="mt-32 text-center">
        <h2 className="text-3xl font-bold mb-6">Have a project in mind?</h2>
        <Button asChild size="lg" className="h-14 px-8 text-base">
          <Link href="/contact">Let's Build It Together <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </div>
    </div>
  );
}
