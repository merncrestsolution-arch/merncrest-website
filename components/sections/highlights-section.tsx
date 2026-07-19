"use client";

import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

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
    <StitchSection className="!py-14 border-y border-white/[0.05]">
      <StitchHeader
        eyebrow="Company highlights"
        title="Numbers that power trust"
        className="mb-10"
      />
      <StitchGrid cols={4}>
        {highlights.map((h, i) => (
          <StitchReveal key={h.label} delay={i * 0.03}>
            <StitchCard className="!py-5">
              <p className="font-display text-3xl sm:text-4xl font-bold gradient-text">{h.value}</p>
              <p className="text-sm text-muted mt-1">{h.label}</p>
            </StitchCard>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
