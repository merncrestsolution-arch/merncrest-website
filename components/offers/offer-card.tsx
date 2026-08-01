"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENT_THEMES, OFFER_THEME_ACCENTS, type PublicOffer } from "@/lib/offers/types";
import { StitchChip } from "@/components/ui/stitch";

type OfferCardProps = {
  offer: PublicOffer;
  className?: string;
  priority?: boolean;
};

export function OfferCard({ offer, className, priority = false }: OfferCardProps) {
  const accent = OFFER_THEME_ACCENTS[offer.gradientTheme] ?? OFFER_THEME_ACCENTS.blue;
  const href = `/offers/${offer.slug}`;
  const posterSrc = offer.imageUrl;

  if (posterSrc) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn("group h-full", className)}
        style={
          {
            "--offer-accent-a": accent.a,
            "--offer-accent-b": accent.b,
          } as React.CSSProperties
        }
      >
        <Link href={href} className="offer-stitch-card h-full">
          {/* Poster frame */}
          <div className="offer-stitch-frame">
            <span className="offer-stitch-accent" aria-hidden />
            <Image
              src={posterSrc}
              alt={offer.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={priority}
              loading={priority ? undefined : "lazy"}
              className="object-contain object-center p-1 transition-transform duration-500 group-hover:scale-[1.015]"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-4 sm:p-5 lg:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {offer.badge && (
                <StitchChip
                  className={cn(
                    "border font-bold uppercase tracking-wider text-[10px]",
                    accent.chip
                  )}
                >
                  {offer.badge}
                </StitchChip>
              )}
              {offer.category && (
                <span className="font-mono text-[10px] uppercase tracking-widest stitch-muted-fg">
                  {offer.category}
                </span>
              )}
            </div>

            <h3 className="font-display text-lg font-bold leading-snug stitch-fg sm:text-xl lg:text-[1.35rem]">
              {offer.title}
            </h3>

            {offer.price && (
              <p className="mt-2 font-mono text-xs uppercase tracking-widest stitch-muted-fg">
                Starting from{" "}
                <span className="text-base font-bold normal-case tracking-normal stitch-fg lg:text-lg">
                  {offer.price}
                </span>
              </p>
            )}

            {offer.features.length > 0 && (
              <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
                {offer.features.slice(0, 4).map((feature) => (
                  <li
                    key={feature}
                    className="inline-flex items-center gap-1 rounded-full border border-stitch-outline bg-stitch-surface-low px-2.5 py-1 text-[10px] font-medium stitch-muted-fg"
                  >
                    <Check className="h-3 w-3 shrink-0 text-stitch-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto pt-5">
              <span className="offer-stitch-cta">
                <span>{offer.ctaText || "View Details"}</span>
                <span className="offer-stitch-cta-sub hidden sm:inline">Click here</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  /* Gradient fallback when no poster image */
  const theme = GRADIENT_THEMES[offer.gradientTheme] ?? GRADIENT_THEMES.blue;

  return (
    <motion.article
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn("group h-full", className)}
    >
      <Link
        href={href}
        className={cn(
          "relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 p-6",
          "bg-gradient-to-br backdrop-blur-xl transition-shadow duration-500",
          theme.card,
          theme.glow,
          "hover:shadow-2xl"
        )}
      >
        {offer.badge && (
          <span
            className={cn(
              "mb-4 inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
              theme.badge
            )}
          >
            {offer.badge}
          </span>
        )}

        <h3 className="font-display text-2xl font-bold tracking-tight text-white">{offer.title}</h3>

        {offer.price && (
          <p className="mt-3 font-display text-xl font-semibold text-white">{offer.price}</p>
        )}

        {offer.description && (
          <p className="mt-4 flex-1 text-sm leading-relaxed text-white/75">{offer.description}</p>
        )}

        <span className="offer-stitch-cta mt-6">
          {offer.ctaText || "View Details"}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </motion.article>
  );
}
