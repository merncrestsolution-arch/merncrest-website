"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function AboutSection() {
  const t = useTranslations("aboutSnippet");
  const tCommon = useTranslations("common");

  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden glass-card"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-accent-alt/10" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center mix-blend-overlay opacity-50" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 dark:bg-background/40 backdrop-blur-[2px]">
              <div className="glass-card p-6 border-white/20">
                <h3 className="text-3xl font-bold text-white mb-2">5+</h3>
                <p className="text-sm text-white/80 font-medium">Years of Excellence</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
                {t("badge")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-6">
                {t("title")}
              </h2>
              <p className="text-muted leading-relaxed">
                {t("description")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button asChild size="lg" className="group">
                <Link href="/about">
                  {tCommon("learnMore")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
