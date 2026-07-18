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

      <div className="container-wide relative z-10 pb-20 pt-40 sm:pt-36 lg:py-36">
        <div className="max-w-3xl space-y-6 sm:space-y-7">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white"
          >
            MernCrest
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.15] text-balance text-white/95"
          >
            {t("headline")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed"
          >
            {t("subheadline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1"
          >
            <Button asChild size="lg">
              <Link href="/services">{t("ctaExplore")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/25 text-white hover:bg-white/10">
              <Link href="/contact">
                {t("ctaConsultation")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-white/80 hover:text-white hover:bg-white/10">
              <Link href="/contact">{t("ctaSales")}</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
