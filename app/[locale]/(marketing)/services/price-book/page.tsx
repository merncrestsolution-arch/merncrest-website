import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, BookOpen } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { QuoteDialog } from "@/components/forms/quote-dialog";
import { priceBookCatalog, priceBookExecutiveSummary } from "@/lib/data/price-book";

export const metadata = {
  title: "Master Price Book 2026–2027 | MernCrest",
  description:
    "Official MernCrest Solutions master price book — 10 volumes covering branding, websites, mobile apps, POS, ERP, business systems, AI, cloud, marketing, and enterprise support.",
};

export default async function PriceBookHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Master Price Book 2026–2027"
        title="MernCrest Solutions — Complete Service Catalog"
        description={priceBookExecutiveSummary}
        align="left"
      >
        <QuoteDialog formType="pricing" label="Request a Custom Quote" />
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <div className="grid md:grid-cols-2 gap-5">
          {priceBookCatalog.map((entry) => (
            <Link
              key={entry.slug}
              href={entry.href}
              className="stitch-card stitch-card-hover block group"
            >
              <p className="text-xs font-mono uppercase tracking-wider text-stitch-glow mb-2">
                Volume {String(entry.volume).padStart(2, "0")}
              </p>
              <h2 className="font-display text-xl font-bold text-foreground group-hover:text-stitch-glow transition-colors">
                {entry.title}
              </h2>
              <p className="mt-3 text-sm text-muted leading-relaxed">{entry.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm text-stitch-glow">
                View pricing <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

        <div className="stitch-card text-center !py-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
          <BookOpen className="relative z-10 h-10 w-10 text-stitch-glow mx-auto mb-4" />
          <h2 className="relative z-10 font-display text-2xl font-bold text-foreground mb-3">
            Over 200 services. One transparent catalog.
          </h2>
          <p className="relative z-10 text-muted mb-6 max-w-2xl mx-auto">
            Every volume includes package tiers, add-ons, delivery timelines, payment terms, and
            warranty or AMC options. Use this catalog for quotations, proposals, and scoping
            conversations.
          </p>
          <div className="relative z-10">
            <QuoteDialog formType="pricing" label="Request a Custom Quote" />
          </div>
        </div>
      </div>
    </div>
  );
}
