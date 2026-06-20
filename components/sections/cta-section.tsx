"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const tSection = useTranslations("ctaSnippet");

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden glass-panel border border-accent/20 p-10 sm:p-16 text-center"
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent-alt/10 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent blur-[100px] rounded-full opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-alt blur-[100px] rounded-full opacity-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold font-display leading-tight text-balance">
              {tSection("title")}
            </h2>
            <p className="text-lg sm:text-xl text-muted leading-relaxed">
              {tSection("description")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-base shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all">
                <Link href="/contact">{tSection("button")}</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
