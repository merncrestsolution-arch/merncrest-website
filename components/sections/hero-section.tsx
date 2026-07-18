"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroAtmosphere } from "./hero-atmosphere";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-[100svh] flex items-end sm:items-center overflow-hidden">
      <HeroAtmosphere />

      <div className="container-wide relative z-10 pb-20 pt-32 sm:py-28 lg:py-32">
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white"
          >
            MernCrest
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.15] text-balance text-white/95"
          >
            {t("headline")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed"
          >
            {t("subheadline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/products">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-white/25 text-white hover:bg-white/10">
              <Link href="/contact">
                {t("ctaSecondary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="h-8 w-px bg-gradient-to-b from-teal-400/80 to-transparent"
        />
      </motion.div>
    </section>
  );
}
