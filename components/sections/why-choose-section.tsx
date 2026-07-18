"use client";

import { Reveal } from "@/components/motion/reveal";

const reasons = [
  "Certified Experts",
  "AI-Powered Support",
  "24/7 Customer Support",
  "Enterprise Security",
  "Fast Deployment",
  "Transparent Pricing",
  "Scalable Solutions",
  "Reliable Infrastructure",
];

export function WhyChooseSection() {
  return (
    <section className="section-padding ocean-mesh">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Why MernCrest</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Why choose MernCrest</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, i) => (
            <Reveal key={r} delay={i * 0.04}>
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <p className="font-medium">{r}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
