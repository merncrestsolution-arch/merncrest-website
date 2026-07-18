"use client";

import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { productCategories } from "@/lib/data/products";
import { ArrowRight } from "lucide-react";

export function ProductsSection() {
  return (
    <section className="section-padding border-t border-white/5">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Marketplace</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Buy domains, hosting, and software online</h2>
          <p className="mt-4 text-muted text-lg">One catalog. One account. Managed from the customer portal.</p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {productCategories.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 0.05}>
              <Link href={`/products/${cat.slug}`} className="group block space-y-2">
                <h3 className="font-display text-xl font-semibold group-hover:text-accent transition-colors">
                  {cat.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed line-clamp-2">{cat.description}</p>
                <span className="inline-flex items-center gap-1 text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
