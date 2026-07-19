"use client";

import { Link } from "@/i18n/routing";
import { featuredServiceCards } from "@/lib/navigation";
import { ArrowRight } from "lucide-react";
import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

export function FeaturedServicesSection() {
  return (
    <StitchSection mesh>
      <StitchHeader
        eyebrow="Featured services"
        title="What you can launch today"
        description="Domains to AI — buy online or request a quote."
        className="mb-12"
      />
      <StitchGrid cols={3}>
        {featuredServiceCards.map((s, i) => (
          <StitchReveal key={s.title} delay={i * 0.04}>
            <StitchCard as="article" className="h-full flex flex-col">
              <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed flex-1">{s.desc}</p>
              <p className="mt-4 text-sm font-medium text-violet-300">{s.price}</p>
              <div className="mt-5 flex gap-4 text-sm">
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1 text-white hover:text-violet-300"
                >
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/register" className="text-muted hover:text-violet-300">
                  Buy now
                </Link>
              </div>
            </StitchCard>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
