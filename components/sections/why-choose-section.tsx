"use client";

import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

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
    <StitchSection mesh>
      <StitchHeader
        eyebrow="Why MernCrest"
        title="Why choose MernCrest"
        className="mb-12"
      />
      <StitchGrid cols={4}>
        {reasons.map((r, i) => (
          <StitchReveal key={r} delay={i * 0.04}>
            <StitchCard className="flex items-start gap-3 !py-5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
              <p className="font-medium text-white">{r}</p>
            </StitchCard>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
