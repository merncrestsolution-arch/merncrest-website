"use client";

import { Link } from "@/i18n/routing";
import { productCategories } from "@/lib/data/products";
import { ArrowRight } from "lucide-react";
import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

export function ProductsSection() {
  return (
    <StitchSection className="border-t border-white/[0.05]">
      <StitchHeader
        eyebrow="Marketplace"
        title="Buy domains, hosting, and software online"
        description="One catalog. One account. Managed from the customer portal."
        className="mb-12"
      />
      <StitchGrid cols={3}>
        {productCategories.map((cat, i) => (
          <StitchReveal key={cat.slug} delay={i * 0.05}>
            <Link href={`/products/${cat.slug}`} className="block h-full group">
              <StitchCard className="h-full">
                <h3 className="font-display text-xl font-semibold text-white group-hover:text-violet-200 transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-violet-300">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </StitchCard>
            </Link>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
