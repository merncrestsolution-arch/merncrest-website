import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOfferBySlug, getAllOfferSlugs, GRADIENT_THEMES } from "@/lib/offers";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  try {
    const slugs = await getAllOfferSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);
  if (!offer) return {};

  const title = offer.seoTitle || `${offer.title} | MernCrest Offers`;
  const description = offer.seoDescription || offer.description || undefined;
  const url = `https://merncrest.lk/offers/${offer.slug}`;
  const image = offer.bannerImageUrl || offer.imageUrl;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "MernCrest Solutions",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const offer = await getOfferBySlug(slug);
  if (!offer) notFound();

  const theme = GRADIENT_THEMES[offer.gradientTheme] ?? GRADIENT_THEMES.blue;
  const heroImage = offer.bannerImageUrl || offer.imageUrl;
  const ctaHref = offer.ctaUrl || `/contact?offer=${offer.slug}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.title,
    description: offer.description,
    image: heroImage,
    brand: { "@type": "Brand", name: "MernCrest Solutions" },
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: offer.price?.replace(/[^\d.]/g, "") || undefined,
      availability: "https://schema.org/InStock",
      url: `https://merncrest.lk/offers/${offer.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <article className="stitch-page pb-24">
        <div className="relative min-h-[50vh] overflow-hidden border-b border-stitch-outline">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              theme.card
            )}
          />
          {heroImage && (
            <Image
              src={heroImage}
              alt={offer.title}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--stitch-bg)] via-[var(--stitch-bg)]/60 to-transparent" />

          <div className="stitch-container relative z-10 pt-32 pb-16">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            {offer.badge && (
              <span
                className={cn(
                  "mb-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                  theme.badge
                )}
              >
                {offer.badge}
              </span>
            )}

            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl max-w-3xl">
              {offer.title}
            </h1>

            {offer.price && (
              <div className="mt-6">
                <p className="text-xs font-mono uppercase tracking-widest text-muted">Starting From</p>
                <p className="font-display text-3xl font-semibold text-foreground">{offer.price}</p>
              </div>
            )}

            {offer.description && (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{offer.description}</p>
            )}
          </div>
        </div>

        <div className="stitch-container py-16">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              {offer.features.length > 0 && (
                <section>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    What&apos;s Included
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {offer.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 rounded-xl border border-stitch-outline bg-white/[0.02] px-4 py-3"
                      >
                        <Check className="h-4 w-4 shrink-0 text-stitch-primary" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {offer.category && (
                <p className="mt-8 text-sm text-muted">
                  Category: <span className="text-foreground">{offer.category}</span>
                </p>
              )}
            </div>

            <aside className="lg:col-span-2">
              <div className="sticky top-28 rounded-2xl border border-stitch-outline bg-white/[0.03] p-6 backdrop-blur-xl">
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Get This Offer
                </h3>
                <p className="text-sm text-muted mb-6">
                  Contact our team for a tailored quote and implementation timeline.
                </p>
                {offer.price && (
                  <p className="font-display text-2xl font-bold text-foreground mb-6">{offer.price}</p>
                )}
                <Button asChild className="w-full gap-2" size="lg">
                  <Link href={ctaHref}>
                    {offer.ctaText || "View Details"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full mt-3">
                  <Link href="/contact">Request Consultation</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
