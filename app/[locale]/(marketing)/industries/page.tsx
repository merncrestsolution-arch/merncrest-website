import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { industries } from "@/lib/data/industries";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { QuoteDialog } from "@/components/forms/quote-dialog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "industriesPage" });
  return {
    title: `${t("title")} | MernCrest`,
    description: t("description"),
  };
}

const solutionSlugMap: Record<string, string> = {
  manufacturing: "iot",
  distribution: "logistics",
  "retail-wholesale": "pos",
  healthcare: "healthcare",
  education: "education",
  hospitality: "booking",
  construction: "erp",
  finance: "fintech",
  logistics: "logistics",
  government: "saas",
  ngos: "saas",
  "sme-enterprise": "erp",
};

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("industriesPage");

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      >
        <QuoteDialog formType="industries" label="Discuss Your Project" />
      </PageHero>
      <div className="stitch-page-body stitch-stack-lg">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind) => (
            <Link
              key={ind.slug}
              href={`/solutions/${solutionSlugMap[ind.slug] || "erp"}`}
              className="stitch-card stitch-card-hover group block"
            >
              <h2 className="font-display text-xl font-semibold text-foreground inline-flex items-center gap-2">
                {ind.title}
                <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">{ind.description}</p>
            </Link>
          ))}
        </div>

        <div className="stitch-card text-center !py-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
          <h2 className="relative z-10 font-display text-2xl font-bold text-foreground mb-3">
            {t("ctaTitle")}
          </h2>
          <p className="relative z-10 text-muted mb-7 max-w-xl mx-auto">{t("ctaBody")}</p>
          <div className="relative z-10 flex justify-center">
            <QuoteDialog formType="industries" label="Discuss Your Project" />
          </div>
        </div>
      </div>
    </div>
  );
}
