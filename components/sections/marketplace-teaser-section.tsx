"use client";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { StitchSection, StitchReveal } from "@/components/ui/stitch";
import { DomainSearch } from "@/components/domains/domain-search";

/** Stitch homepage: Infrastructure Marketplace teaser */
export function MarketplaceTeaserSection() {
  return (
    <StitchSection className="!py-16 bg-[#1b1b1f]/30">
      <StitchReveal>
        <div className="stitch-card !p-8 sm:!p-12 relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Infrastructure Marketplace
            </h2>
            <p className="text-[#ccc3d8] leading-relaxed mb-8">
              Secure your digital identity and hosting foundation instantly. Connect your enterprise
              to the global web with premium domain assets.
            </p>
            <div className="max-w-lg rounded-xl border border-[#4a4455] bg-[#0e0e12] p-3">
              <DomainSearch />
            </div>
            <p className="mt-6 font-mono text-[12px] text-[#958da1]">
              Popular: .ai, .cloud, .io, .tech
            </p>
            <Button asChild className="mt-6 rounded-xl bg-[#7c3aed]">
              <Link href="/domains">Browse domains</Link>
            </Button>
          </div>
        </div>
      </StitchReveal>
    </StitchSection>
  );
}
