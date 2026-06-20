"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";

const projects = [
  {
    title: "FinServe Digital Banking",
    category: "FinTech",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    description: "A complete digital banking solution with secure transactions and wealth management.",
  },
  {
    title: "EduPro Learning Platform",
    category: "Education",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80",
    description: "An interactive LMS serving over 50,000 students globally with real-time classes.",
  },
  {
    title: "MedCare Hospital ERP",
    category: "Healthcare",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    description: "Comprehensive hospital management system compliant with international health data standards.",
  }
];

export function PortfolioSection() {
  const tSection = useTranslations("portfolioSnippet");
  const tCommon = useTranslations("common");

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container-wide relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
              {tSection("badge")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {tSection("title")}
            </h2>
            <p className="text-muted">
              {tSection("description")}
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 group hidden md:flex">
            <Link href="/portfolio">
              {tCommon("viewAll")} Projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group rounded-2xl overflow-hidden glass-panel border border-white/10"
            >
              <div className="relative h-60 overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 text-xs font-semibold bg-black/50 backdrop-blur-md text-white rounded-full border border-white/20">
                    {project.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 flex items-center justify-between group-hover:text-accent transition-colors">
                  {project.title}
                  <ExternalLink className="h-4 w-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-muted text-sm line-clamp-2">
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 md:hidden flex justify-center">
          <Button asChild variant="outline" className="group">
            <Link href="/portfolio">
              {tCommon("viewAll")} Projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
