"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

const projects = [
  {
    title: "FinServe Digital Banking",
    category: "FinTech",
    image:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    description: "A complete digital banking solution with secure transactions and wealth management.",
  },
  {
    title: "EduPro Learning Platform",
    category: "Education",
    image:
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80",
    description: "An interactive LMS serving over 50,000 students globally with real-time classes.",
  },
  {
    title: "MedCare Hospital ERP",
    category: "Healthcare",
    image:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    description:
      "Comprehensive hospital management system compliant with international health data standards.",
  },
];

export function PortfolioSection() {
  const tSection = useTranslations("portfolioSnippet");
  const tCommon = useTranslations("common");

  return (
    <StitchSection>
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <StitchHeader
          eyebrow={tSection("badge")}
          title={tSection("title")}
          description={tSection("description")}
        />
        <Button asChild variant="outline" className="shrink-0 hidden md:inline-flex rounded-full">
          <Link href="/portfolio">
            {tCommon("viewAll")} Projects
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <StitchGrid cols={3}>
        {projects.map((project, index) => (
          <StitchReveal key={project.title} delay={index * 0.06}>
            <StitchCard className="h-full overflow-hidden !p-0 flex flex-col group">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <p className="text-[11px] font-mono uppercase tracking-wider text-violet-300 mb-2">
                  {project.category}
                </p>
                <h3 className="font-display text-lg font-semibold text-white">{project.title}</h3>
                <p className="mt-2 text-sm text-muted line-clamp-2">{project.description}</p>
              </div>
            </StitchCard>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
