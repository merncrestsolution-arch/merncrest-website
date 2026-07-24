"use client";

import { useTranslations } from "next-intl";
import { Quote, Star } from "lucide-react";
import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

/**
 * Real customer testimonials only. Fabricated quotes were removed
 * (no invented reviewers — "no fabricated content" rule). Populate with
 * genuine, approved testimonials to re-enable this section.
 */
const testimonials: {
  quote: string;
  author: string;
  role: string;
  rating: number;
}[] = [];

export function TestimonialsSection() {
  const tSection = useTranslations("testimonialsSnippet");

  if (testimonials.length === 0) return null;

  return (
    <StitchSection>
      <StitchHeader
        eyebrow={tSection("badge")}
        title={tSection("title")}
        description={tSection("description")}
        align="center"
        className="mb-12"
      />
      <StitchGrid cols={3}>
        {testimonials.map((testimonial, index) => (
          <StitchReveal key={testimonial.author} delay={index * 0.08}>
            <StitchCard className="relative h-full flex flex-col">
              <Quote className="absolute top-5 right-5 h-10 w-10 text-violet-500/15" />
              <div className="flex gap-1 mb-5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-violet-400 text-violet-400" />
                ))}
              </div>
              <p className="text-muted leading-relaxed mb-8 flex-1 italic">
                “{testimonial.quote}”
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-sm font-bold text-foreground">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{testimonial.author}</h4>
                  <p className="text-xs text-muted">{testimonial.role}</p>
                </div>
              </div>
            </StitchCard>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
