"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { StitchSection, StitchReveal } from "@/components/ui/stitch";

export function CTASection() {
  const tSection = useTranslations("ctaSnippet");

  return (
    <StitchSection>
      <StitchReveal>
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-white/[0.03] p-10 sm:p-16 text-center shadow-glow">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-indigo-600/10" />
          <div className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-violet-500/25 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white text-balance">
              {tSection("title")}
            </h2>
            <p className="text-lg text-muted leading-relaxed">{tSection("description")}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Button asChild size="lg" className="rounded-full h-12 px-8 shadow-glow">
                <Link href="/contact">{tSection("button")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-8">
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </div>
        </div>
      </StitchReveal>
    </StitchSection>
  );
}
