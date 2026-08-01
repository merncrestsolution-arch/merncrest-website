"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENT_THEMES, type PublicOffer } from "@/lib/offers/types";

type OfferCardProps = {
  offer: PublicOffer;
  className?: string;
  priority?: boolean;
};

export function OfferCard({ offer, className, priority = false }: OfferCardProps) {
  const theme = GRADIENT_THEMES[offer.gradientTheme] ?? GRADIENT_THEMES.blue;
  const href = `/offers/${offer.slug}`;

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
        {/* Background image with zoom on hover */}
        {(offer.bannerImageUrl || offer.imageUrl) && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <Image
              src={offer.bannerImageUrl || offer.imageUrl || ""}
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

        {/* Glass overlay */}
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

          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors group-hover:text-white/90">
            {offer.ctaText || "View Details"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
