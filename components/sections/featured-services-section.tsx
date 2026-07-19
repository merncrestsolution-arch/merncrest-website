"use client";

import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { featuredServiceCards } from "@/lib/navigation";
import { ArrowRight } from "lucide-react";

export function FeaturedServicesSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" aria-hidden />
      <div className="container-wide relative z-10">
        <Reveal className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300 mb-3">
            Featured services
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            What you can launch today
          </h2>
          <p className="mt-4 text-muted text-lg">
            Domains to AI — buy online or request a quote.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredServiceCards.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04}>
              <article className="group relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-violet-400/40 hover:bg-violet-500/[0.06] hover:shadow-glow">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{s.desc}</p>
                <p className="mt-4 text-sm font-medium text-violet-300">{s.price}</p>
                <div className="mt-5 flex gap-4 text-sm">
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-1 text-white transition-colors hover:text-violet-300"
                  >
                    Learn more{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link href="/register" className="text-muted hover:text-violet-300">
                    Buy now
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
