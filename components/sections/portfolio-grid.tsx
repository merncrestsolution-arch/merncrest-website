"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export type PortfolioCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string | null;
  description: string | null;
  tech: string[];
  metric: string | null;
  featured: boolean;
};

export function PortfolioGrid({ projects }: { projects: PortfolioCard[] }) {
  const t = useTranslations("portfolioPage");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))],
    [projects]
  );

  const filteredProjects = projects.filter(
    (project) => activeCategory === "All" || project.category === activeCategory
  );

  return (
    <div className="w-full">
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
                activeCategory === category
                  ? "bg-accent border-accent text-foreground shadow-[0_0_20px_rgba(var(--accent),0.4)]"
                  : "bg-transparent border-black/10 dark:border-stitch-outline text-muted hover:border-black/30 dark:hover:border-white/30 hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, type: "spring" }}
              key={project.id}
              className={`group relative overflow-hidden rounded-3xl glass-card border-black/10 dark:border-white/5 hover:border-accent/50 dark:hover:border-accent/50 transition-colors ${
                project.featured && activeCategory === "All" ? "lg:col-span-2" : "col-span-1"
              }`}
            >
              <div className="relative h-[300px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent z-10" />
                {project.image && (
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}

                <div className="absolute top-6 left-6 z-20 flex gap-2">
                  <span className="px-3 py-1.5 text-[10px] font-bold bg-background/80 dark:bg-background/50 backdrop-blur-md text-foreground dark:text-foreground rounded-full border border-black/10 dark:border-stitch-outline uppercase tracking-widest">
                    {project.category}
                  </span>
                </div>

                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Dynamic portfolio slug — next-intl route typing */}
                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="flex items-center gap-2 bg-accent text-foreground px-6 py-3 rounded-full font-bold translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl"
                  >
                    {t("viewCaseStudy")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="p-8 relative z-20 bg-background/80 dark:bg-background/50 backdrop-blur-sm -mt-20 group-hover:bg-background transition-colors h-full flex flex-col border-t border-black/5 dark:border-white/5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-2xl font-bold text-foreground dark:text-foreground group-hover:text-accent transition-colors text-balance">
                    {project.title}
                  </h3>
                  {project.metric && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full shrink-0">
                      <TrendingUp className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs font-bold text-accent">{project.metric}</span>
                    </div>
                  )}
                </div>

                <p className="text-muted leading-relaxed mb-8 flex-grow">{project.description}</p>

                {project.tech.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-black/10 dark:border-stitch-outline">
                    {project.tech.map((tech, j) => (
                      <span
                        key={j}
                        className="text-xs font-mono text-muted-foreground px-2 py-1 bg-black/5 dark:bg-white/5 rounded-md border border-black/5 dark:border-white/5"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20 text-muted">
          {projects.length === 0 ? (
            <div className="max-w-md mx-auto space-y-3">
              <p className="text-lg font-semibold text-foreground">{t("comingSoonTitle")}</p>
              <p className="text-sm">
                {t("comingSoonBody")}{" "}
                <Link href="/contact" className="text-accent hover:underline">
                  {t("talkToUs")}
                </Link>
                .
              </p>
            </div>
          ) : (
            t("noneInCategory")
          )}
        </div>
      )}
    </div>
  );
}
