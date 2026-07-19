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

const testimonials = [
  {
    quote:
      "MERNcrest completely transformed our legacy ERP system. Their team's technical depth and agile approach helped us launch 2 months ahead of schedule.",
    author: "Samantha Perera",
    role: "CTO, Global Logistics Solutions",
    rating: 5,
  },
  {
    quote:
      "The e-commerce app they built for us handles thousands of concurrent users flawlessly. A truly premium experience from start to finish.",
    author: "Mohammed Rizwan",
    role: "Founder, Trendz LK",
    rating: 5,
  },
  {
    quote:
      "Their cybersecurity audit and subsequent implementations saved us from a major vulnerability. Highly professional and responsive team.",
    author: "David Chen",
    role: "Director of IT, SecureFin",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const tSection = useTranslations("testimonialsSnippet");

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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-sm font-bold text-white">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{testimonial.author}</h4>
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
