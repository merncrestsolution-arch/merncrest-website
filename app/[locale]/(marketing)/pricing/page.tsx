import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { pricingTiers } from "@/lib/data/pricing";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/commerce-format";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/ui/page-hero";
import { QuoteDialog } from "@/components/forms/quote-dialog";
import { PriceBookCatalogSection } from "@/components/marketing/price-book-catalog-section";

export const metadata = {
  title: "Pricing | MernCrest",
  description:
    "Transparent plans for websites, hosting, and enterprise software. Live marketplace hosting prices and custom quotes for ERP, CRM, and cloud projects.",
};

async function getHostingPreview() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true, category: "hosting" },
      orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
      take: 3,
      select: {
        id: true,
        slug: true,
        name: true,
        marketingTitle: true,
        priceCents: true,
        currency: true,
        billingPeriod: true,
      },
    });
    return products;
  } catch {
    return [];
  }
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hosting = await getHostingPreview();

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Pricing"
        title="Plans that grow with you"
        description="Start with hosting and websites, or go enterprise with custom ERP, CRM, and SLA support. Software project pricing is scoped per engagement — request a quote and we'll tailor it to you."
      >
        <QuoteDialog formType="pricing" label="Request a Custom Quote" />
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <PriceBookCatalogSection
          title="Software & services price book"
          description="Browse official LKR package pricing for websites, mobile apps, ERP, AI, cloud, marketing, and enterprise support — use this catalog when requesting a quote."
        />

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto w-full">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "relative flex h-full flex-col stitch-card",
                tier.featured && "border-violet-400/40 bg-violet-500/[0.07] shadow-glow"
              )}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-wider bg-gradient-accent text-foreground px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <h2 className="font-display text-2xl font-bold text-foreground">{tier.name}</h2>
              <p className="mt-2 text-sm text-muted">{tier.description}</p>
              <p className="mt-6 font-display text-3xl font-bold text-foreground">
                {tier.price}
                <span className="text-base font-sans font-normal text-muted">{tier.period}</span>
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted">
                    <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {tier.id === "enterprise" ? (
                <div className="mt-8">
                  <QuoteDialog formType="pricing" interest={tier.name} label={tier.cta} fullWidth />
                </div>
              ) : (
                <Button
                  asChild
                  className="mt-8 w-full rounded-full"
                  variant={tier.featured ? "default" : "outline"}
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        {hosting.length > 0 && (
          <div>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground inline-flex items-center gap-2">
                  <Server className="h-5 w-5 text-stitch-glow" /> Hosting &amp; domains
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Live prices from our marketplace — resold through trusted providers.
                </p>
              </div>
              <Link
                href="/hosting"
                className="hidden sm:inline-flex items-center gap-1 text-sm text-stitch-glow hover:text-violet-200"
              >
                View all plans <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {hosting.map((p) => (
                <Link
                  key={p.id}
                  href="/hosting"
                  className="stitch-card stitch-card-hover block"
                >
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {p.marketingTitle || p.name}
                  </h3>
                  <p className="mt-4 font-display text-2xl font-bold text-foreground">
                    {formatMoney(p.priceCents, p.currency)}
                    {p.billingPeriod && (
                      <span className="text-sm font-sans font-normal text-muted">
                        {" "}
                        / {p.billingPeriod.toLowerCase()}
                      </span>
                    )}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm text-stitch-glow">
                    Configure <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="stitch-card text-center !py-14 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
          <h2 className="relative z-10 font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Need something tailored?
          </h2>
          <p className="relative z-10 text-muted mb-8 max-w-xl mx-auto">
            Every software project is different. Tell us your scope and we&apos;ll send a clear, itemized quote.
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-3">
            <QuoteDialog formType="pricing" label="Request a Custom Quote" />
            <Button asChild variant="outline" className="rounded-full border-stitch-outline">
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
