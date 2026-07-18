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
    <section className="section-padding border-y border-white/5">
      <div className="container-wide">
        <Reveal className="mb-10 max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Company highlights</p>
          <h2 className="font-display text-3xl font-bold">Numbers that power trust</h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 0.03}>
              <p className="font-display text-3xl sm:text-4xl font-bold gradient-text">{h.value}</p>
              <p className="text-sm text-muted mt-1">{h.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
