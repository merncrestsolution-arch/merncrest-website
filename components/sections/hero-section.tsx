"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function AnimatedHeadline({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-balance tracking-tight text-center lg:text-left">
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          className="inline-block mr-[0.25em]"
        >
          {i >= words.length - 2 ? (
            <span className="gradient-text">{word}</span>
          ) : (
            word
          )}
        </motion.span>
      ))}
    </h1>
  );
}

import Image from "next/image";

function HeroVisual() {
  return (
    <div className="relative h-[320px] sm:h-[400px] lg:h-[500px] w-full">
      {/* Floating orbs for background ambiance without a hard box */}
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-accent/20 blur-[80px]"
      />
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent-alt/10 blur-[100px]"
      />
      
      {/* Massive Center Logo floating freely */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
          className="flex items-center justify-center p-8 lg:p-12 drop-shadow-[0_0_40px_rgba(var(--accent),0.2)]"
        >
          {/* Light Mode Logo */}
          <Image 
            src="/logo.png.svg" 
            alt="MERNcrest Solutions" 
            width={1000} 
            height={400} 
            className="h-40 sm:h-56 lg:h-[350px] w-auto object-contain scale-[1.1] sm:scale-[1.2] lg:scale-[1.6] transform origin-center dark:hidden"
            priority
          />
          {/* Dark Mode Logo */}
          <Image 
            src="/logo-dark.svg.svg" 
            alt="MERNcrest Solutions" 
            width={1000} 
            height={400} 
            className="h-40 sm:h-56 lg:h-[350px] w-auto object-contain scale-[1.1] sm:scale-[1.2] lg:scale-[1.6] transform origin-center hidden dark:block"
            priority
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute bottom-10"
        >
          <div className="glass-card px-6 py-2 rounded-full text-center border-white/5 shadow-xl bg-background/40 backdrop-blur-md">
            <p className="text-sm font-medium text-muted tracking-wide">
              Enterprise software <span className="text-accent mx-2">•</span> Cloud <span className="text-accent mx-2">•</span> Security
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const t = useTranslations("hero");

  const trustStats = [
    t("trustProjects"),
    t("trustClients"),
    t("trustExperience"),
    t("trustSupport"),
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container-wide section-padding relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <AnimatedHeadline text={t("headline")} />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-base sm:text-lg text-muted max-w-xl leading-relaxed mx-auto lg:mx-0"
            >
              {t("subheadline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/contact">{t("ctaConsultation")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/portfolio">
                  {t("ctaPortfolio")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                <Link href="/contact">{t("ctaProposal")}</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-white/10 justify-center lg:justify-start w-full"
            >
              {trustStats.map((stat) => (
                <span
                  key={stat}
                  className="text-sm font-medium text-muted flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {stat}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
