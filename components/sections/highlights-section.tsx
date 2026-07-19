"use client";

import { Reveal } from "@/components/motion/reveal";

const highlights = [
  { value: "5+", label: "Years of experience" },
  { value: "30+", label: "Active customers" },
  { value: "500+", label: "Domains managed" },
  { value: "200+", label: "Hosting accounts" },
  { value: "50+", label: "Projects completed" },
  { value: "15+", label: "Enterprise clients" },
  { value: "98%", label: "Customer satisfaction" },
  { value: "99.9%", label: "Uptime guarantee" },
];

export function HighlightsSection() {
  return (
    <section className="section-padding border-y border-white/5 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-600/5 via-transparent to-indigo-500/5" />
      <div className="container-wide relative z-10">
        <Reveal className="mb-10 max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300 mb-3">
            Company highlights
          </p>
          <h2 className="font-display text-3xl font-bold text-white">Numbers that power trust</h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 0.03}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-display text-3xl sm:text-4xl font-bold gradient-text">{h.value}</p>
                <p className="text-sm text-muted mt-1">{h.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
