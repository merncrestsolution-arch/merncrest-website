import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { QuoteDialog } from "@/components/forms/quote-dialog";
import { PriceBookCatalogSection } from "@/components/marketing/price-book-catalog-section";
import { serviceCategories } from "@/lib/data/service-categories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("services")} | MernCrest`,
    description:
      "Complete IT and digital business solutions — enterprise software, custom development, AI, cloud, security, marketing, and integrations from MernCrest.",
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page min-h-screen">
      <PageHero
        eyebrow="Enterprise Technology"
        title="Complete IT & Digital Business Solutions"
        description="Every service below explains what MernCrest delivers — from enterprise ERP and custom software to AI automation, cloud infrastructure, cyber security, and digital marketing."
        align="left"
      >
        <div className="flex flex-wrap gap-3">
          <QuoteDialog formType="services" label="Request a Quote" />
          <Button asChild variant="outline" className="rounded-full border-stitch-outline">
            <Link href="/contact">Talk to an Expert</Link>
          </Button>
        </div>
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <PriceBookCatalogSection />

        {serviceCategories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Reveal key={cat.slug} delay={i * 0.04}>
              <section id={cat.slug} className="stitch-card scroll-mt-28">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-stitch-glow mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">{cat.title}</h2>
                    <p className="mt-3 text-sm text-muted leading-relaxed">{cat.summary}</p>
                    <p className="mt-3 text-xs text-muted">
                      <span className="font-medium text-foreground/80">Who it&apos;s for:</span>{" "}
                      {cat.audience}
                    </p>
                    <div className="mt-5">
                      <QuoteDialog
                        formType="services"
                        interest={cat.title}
                        label="Request a Quote"
                        variant="outline"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 content-start">
                    {cat.items.map((item) => (
                      <Link
                        key={item.href + item.title}
                        href={item.href}
                        className="group flex flex-col gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4 transition-colors hover:border-violet-500/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium text-foreground leading-snug">{item.title}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-stitch-glow" />
                        </div>
                        <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>
          );
        })}

        <div className="stitch-card text-center !py-14 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
          <h2 className="relative z-10 font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Not sure where to start?
          </h2>
          <p className="relative z-10 text-muted mb-8 max-w-xl mx-auto">
            Tell us about your goals and we&apos;ll recommend the right approach — no obligation.
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-3">
            <QuoteDialog formType="services" label="Request a Quote" />
            <Button asChild variant="outline" className="rounded-full border-stitch-outline">
              <Link href="/solutions">Enterprise Solutions</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
