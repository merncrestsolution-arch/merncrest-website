"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeroAtmosphere } from "./hero-atmosphere";

const TRUST_KEYS = [
  "trustProjects",
  "trustClients",
  "trustExperience",
  "trustSupport",
] as const;

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
            MernCrest{" "}
            <span className="text-accent-blue">Solutions</span>
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.12] text-balance text-white"
          >
            {t("headlinePrefix")}{" "}
            <span className="text-accent">{t("headlineHighlight")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-muted max-w-xl leading-relaxed"
          >
            {t("subheadline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1"
          >
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/contact">{t("ctaConsultation")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white/30 text-white hover:bg-white/10"
            >
              <Link href="/portfolio">
                {t("ctaPortfolio")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/contact"
              className="text-sm text-white underline underline-offset-4 hover:text-accent transition-colors"
            >
              {t("ctaProposal")}
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-x-5 gap-y-2 pt-2"
          >
            {TRUST_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                {t(key)}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
