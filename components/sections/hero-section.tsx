"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ArrowRight } from "lucide-react";
import { HeroAtmosphere } from "./hero-atmosphere";

/** Stitch project screen: MernCrest - Homepage hero (2-column, light-first) */
export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative flex items-center overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28 lg:min-h-[min(100svh,921px)]">
      <HeroAtmosphere />

      <div className="stitch-container relative z-[1]">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-stitch-outline bg-stitch-primary-soft px-4 py-1.5 shadow-sm"
            >
              <BadgeCheck className="h-4 w-4 text-stitch-primary" />
              <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-stitch-primary">
                Next-Gen Enterprise Solutions
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="font-display text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] stitch-fg text-balance sm:text-5xl md:text-[64px]"
            >
              Powering{" "}
              <span className="gradient-text">{t("headlineHighlight")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed stitch-muted-fg lg:mx-0"
            >
              {t("subheadline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center"
            >
              <Button
                asChild
                size="lg"
                className="h-14 rounded-xl bg-gradient-accent px-8 text-white shadow-glow hover:opacity-90"
              >
                <Link href="/solutions">Explore Solutions</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-xl border-2 border-stitch-outline bg-stitch-surface px-8 stitch-fg shadow-sm hover:border-stitch-primary"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  {t("ctaConsultation")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Welcome visual — MernCrest team greeting */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative flex flex-col items-center"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-56 w-56 rounded-full bg-stitch-glow/10 blur-3xl" />

            <div className="relative w-full">
              {/* soft grounding platform beneath the team */}
              <div className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto h-28 w-3/4 rounded-[50%] bg-stitch-primary/20 blur-3xl" />
              <Image
                src="/welcome-team.png"
                alt="MernCrest team welcoming you with a warm greeting"
                width={895}
                height={962}
                priority
                className="relative z-10 mx-auto h-auto w-full max-w-sm object-contain drop-shadow-2xl sm:max-w-md lg:max-w-lg"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
