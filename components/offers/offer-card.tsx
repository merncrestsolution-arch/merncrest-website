"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight, Check, MousePointerClick, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENT_THEMES, type PublicOffer } from "@/lib/offers/types";

type OfferCardProps = {
  offer: PublicOffer;
  className?: string;
  priority?: boolean;
};

function OfferPosterCta({
  theme,
  label,
}: {
  theme: (typeof GRADIENT_THEMES)[string];
  label: string;
}) {
  return (
    <div className="relative pt-1">
      {/* Desktop pulsing glow halo */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-1.5 rounded-2xl opacity-0 blur-xl transition-opacity duration-500",
          "group-hover:opacity-60 lg:animate-offer-cta-pulse lg:group-hover:opacity-80",
          theme.ctaGlow
        )}
        aria-hidden
      />
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className={cn(
          "relative flex w-full overflow-hidden rounded-xl lg:rounded-2xl",
          "shadow-lg shadow-black/10 ring-1 ring-white/25",
          "transition-shadow duration-300 group-hover:shadow-2xl",
          theme.cta
        )}
      >
        {/* Shimmer sweep */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl lg:rounded-2xl"
          aria-hidden
        >
          <span className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-offer-shimmer" />
        </span>

        {/* Button content */}
        <span className="relative flex w-full flex-col items-center justify-center gap-0.5 px-5 py-3.5 sm:flex-row sm:gap-3 lg:px-6 lg:py-4">
          <span className="flex items-center gap-2">
            <Sparkles className="hidden h-4 w-4 text-white/90 lg:block" />
            <span className="text-sm font-bold uppercase tracking-wider text-white lg:text-base">
              {label}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90 lg:text-xs">
            <MousePointerClick className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="hidden sm:inline">Click here</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </span>
        </span>
      </motion.div>
    </div>
  );
}

export function OfferCard({ offer, className, priority = false }: OfferCardProps) {
  const theme = GRADIENT_THEMES[offer.gradientTheme] ?? GRADIENT_THEMES.blue;
  const href = `/offers/${offer.slug}`;
  const posterSrc = offer.imageUrl;

  if (posterSrc) {
    return (
      <motion.article
        whileHover={{ scale: 1.02, y: -6 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={cn("group h-full", className)}
      >
        <Link
          href={href}
          className={cn(
            "relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80",
            "bg-white shadow-md transition-all duration-500",
            "lg:rounded-3xl lg:border-2 lg:border-slate-100 lg:shadow-xl",
            "lg:ring-4 lg:ring-transparent lg:transition-[box-shadow,transform,ring-color]",
            theme.ring,
            theme.glow,
            "hover:border-slate-200 hover:shadow-2xl",
            "lg:hover:-translate-y-1 lg:hover:shadow-[0_28px_60px_-12px_rgba(0,0,0,0.18)]"
          )}
        >
          {/* Desktop shine sweep on card hover */}
          <span
            className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          >
            <span className="absolute -inset-full rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </span>

          <div className="relative w-full shrink-0 overflow-hidden bg-white aspect-[4/5] lg:aspect-[4/5.2]">
            <Image
              src={posterSrc}
              alt={offer.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={priority}
              loading={priority ? undefined : "lazy"}
              className="object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.02] lg:group-hover:scale-[1.035]"
            />
            {/* Desktop corner accent */}
            <div
              className={cn(
                "pointer-events-none absolute right-0 top-0 h-24 w-24 opacity-0 transition-opacity duration-500",
                "bg-gradient-to-bl from-white/20 to-transparent lg:group-hover:opacity-100"
              )}
              aria-hidden
            />
          </div>

          <div
            className={cn(
              "relative z-10 border-t px-4 pb-4 pt-4 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6 lg:pt-5",
              theme.footer
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3 lg:mb-5">
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold leading-snug text-slate-900 sm:text-lg lg:text-xl">
                  {offer.title}
                </h3>
                {offer.price && (
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 lg:text-xs">
                    From{" "}
                    <span className="text-sm font-bold normal-case tracking-normal text-slate-900 lg:text-base">
                      {offer.price}
                    </span>
                  </p>
                )}
              </div>
              {offer.badge && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider shadow-sm ring-1 ring-black/5",
                    "bg-white/95 text-slate-700 lg:px-3 lg:py-1.5 lg:text-[10px]",
                    "transition-transform duration-300 group-hover:scale-105"
                  )}
                >
                  {offer.badge}
                </span>
              )}
            </div>

            <OfferPosterCta theme={theme} label={offer.ctaText || "View Details"} />
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn("group h-full", className)}
    >
      <Link
        href={href}
        className={cn(
          "relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10",
          "bg-gradient-to-br backdrop-blur-xl transition-shadow duration-500",
          theme.card,
          theme.glow,
          "hover:shadow-2xl"
        )}
      >
        {offer.bannerImageUrl && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Image
              src={offer.bannerImageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={priority}
              loading={priority ? undefined : "lazy"}
              className="object-cover opacity-30 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-white/[0.03] backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-7">
          {offer.badge && (
            <span
              className={cn(
                "mb-4 inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                theme.badge
              )}
            >
              {offer.badge}
            </span>
          )}

          <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
            {offer.title}
          </h3>

          {offer.price && (
            <div className="mt-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-white/50">
                Starting From
              </p>
              <p className="font-display text-xl font-semibold text-white sm:text-2xl">
                {offer.price}
              </p>
            </div>
          )}

          {offer.description && (
            <p className="mt-4 flex-1 text-sm leading-relaxed text-white/75 line-clamp-3">
              {offer.description}
            </p>
          )}

          {offer.features.length > 0 && (
            <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2">
              {offer.features.slice(0, 6).map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-xs text-white/80">
                  <Check className="h-3.5 w-3.5 shrink-0 text-white/60" />
                  <span className="truncate">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          <OfferPosterCta theme={theme} label={offer.ctaText || "View Details"} />
        </div>
      </Link>
    </motion.article>
  );
}
