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

type FeaturedProject = {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string | null;
  description: string | null;
};

export function PortfolioSection({ projects = [] }: { projects?: FeaturedProject[] }) {
  const tSection = useTranslations("portfolioSnippet");
  const tCommon = useTranslations("common");

  // Featured, real case studies only. Hidden until genuine work is published.
  if (projects.length === 0) return null;

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
          <StitchReveal key={project.id} delay={index * 0.06}>
            <Link href={`/portfolio/${project.slug}` as any}>
              <StitchCard className="h-full overflow-hidden !p-0 flex flex-col group">
                <div className="relative h-48 w-full overflow-hidden bg-white/5">
                  {project.image && (
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-6">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-stitch-glow mb-2">
                    {project.category}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-foreground">{project.title}</h3>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{project.description}</p>
                </div>
              </StitchCard>
            </Link>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
