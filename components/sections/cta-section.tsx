"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { StitchSection, StitchReveal } from "@/components/ui/stitch";

/** Stitch homepage CTA — violet gradient panel */
export function CTASection() {
  const tSection = useTranslations("ctaSnippet");

  return (
    <StitchSection>
      <StitchReveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7c3aed]/80 to-[#2e2ebe]/80 p-12 md:p-24 text-center">
          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <h2 className="font-display text-4xl sm:text-5xl md:text-[64px] font-extrabold tracking-tight text-[#ede0ff] text-balance leading-[1.1]">
              Ready to Transform?
            </h2>
            <p className="text-lg text-[#ede0ff]/80 leading-relaxed">
              {tSection("description")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 rounded-xl bg-white text-[#7c3aed] hover:bg-white/90"
              >
                <Link href="/portal">Access Portal</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-10 rounded-xl border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/contact">Speak to an Expert</Link>
              </Button>
            </div>
          </div>
        </div>
      </StitchReveal>
    </StitchSection>
  );
}
