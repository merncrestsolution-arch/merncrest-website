"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { serviceMenuItems } from "@/lib/navigation";
import { PageHero } from "@/components/ui/page-hero";

export function ServicesSection({ hideViewAll = false }: { hideViewAll?: boolean }) {
  const t = useTranslations("servicesMenu");
  const tSection = useTranslations("servicesSnippet");
  const tCommon = useTranslations("common");

  return (
    <section className="relative overflow-hidden">
      {hideViewAll ? (
        <PageHero
          eyebrow={tSection("badge")}
          title={tSection("title")}
          description={tSection("description")}
        />
      ) : (
        <div className="container-wide pt-16 md:pt-24 text-center max-w-2xl mx-auto mb-4">
          <p className="text-violet-300 font-mono text-sm uppercase tracking-wider mb-3">
            {tSection("badge")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display text-white">
            {tSection("title")}
          </h2>
          <p className="text-muted">{tSection("description")}</p>
        </div>
      )}

      <div className="container-wide relative z-10 pb-16 md:pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {serviceMenuItems.map((item, index) => {
            const Icon = item.icon;
            const service = item.key;
            return (
              <motion.div
                key={service}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className="group relative block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-violet-500/[0.07] hover:shadow-glow"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 transition-colors group-hover:bg-violet-500/25">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-violet-200">
                    {t(`${service}.title`)}
                  </h3>
                  <p className="mb-4 text-sm text-muted">{t(`${service}.description`)}</p>
                  <div className="flex items-center text-sm font-medium text-violet-300">
                    {tCommon("learnMore")}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {!hideViewAll && (
          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="outline" className="group rounded-full">
              <Link href="/services">
                {tCommon("viewAll")} Services
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
