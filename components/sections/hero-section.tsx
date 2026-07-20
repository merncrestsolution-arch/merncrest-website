"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { HeroAtmosphere } from "./hero-atmosphere";

/** Stitch project screen: MernCrest - Homepage hero */
export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-[min(100svh,921px)] flex items-center justify-center overflow-hidden">
      <HeroAtmosphere />

      <div className="stitch-container relative z-10 py-32 sm:py-40 text-center">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#4a4455] bg-[#1b1b1f] px-4 py-1.5 mb-8"
          >
            <span className="h-2 w-2 rounded-full bg-[#25d366] animate-pulse" />
            <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-[#d2bbff]">
              Next-Gen Intelligence
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display text-4xl sm:text-5xl md:text-[64px] font-extrabold tracking-[-0.02em] leading-[1.1] text-white text-balance"
          >
            Powering{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d2bbff] to-[#d2bbff]/t("headlineHighlight")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-6 text-lg text-[#ccc3d8] max-w-2xl mx-auto leading-relaxed"
          >
            {t("subheadline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              asChild
              size="lg"
              className="h-14 px-8 rounded-xl bg-[#7c3aed] text-[#ede0ff] shadow-[0_0_20px_rgba(210,187,255,0.2)] hover:opacity-90"
            >
              <Link href="/solutions">Explore Solutions</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 rounded-xl border-[#4a4455] bg-white/[0.04] backdrop-blur-md text-white hover:border-[#7c3aed]"
            >
              <Link href="/contact">{t("ctaConsultation")}</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
