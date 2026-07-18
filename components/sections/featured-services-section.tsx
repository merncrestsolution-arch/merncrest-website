"use client";

import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { featuredServiceCards } from "@/lib/navigation";
import { ArrowRight } from "lucide-react";

export function FeaturedServicesSection() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Featured services</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">What you can launch today</h2>
          <p className="mt-4 text-muted text-lg">Domains to AI — buy online or request a quote.</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {featuredServiceCards.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <div className="space-y-2 border-b border-white/10 pb-8 h-full">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
                <p className="text-sm text-accent font-medium">{s.price}</p>
                <div className="flex gap-4 pt-1 text-sm">
                  <Link href={s.href} className="inline-flex items-center gap-1 text-foreground hover:text-accent">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/register" className="text-muted hover:text-accent">
                    Buy now
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
