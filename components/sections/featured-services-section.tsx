"use client";

import { Link } from "@/i18n/routing";
import { Code2, Brain, Cloud, Network, ArrowRight } from "lucide-react";
import {
  StitchSection,
  StitchCard,
  StitchIconBox,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

const pillars = [
  {
    title: "Custom Software",
    body: "Bespoke application development utilizing the latest MERN stack and cloud-native architectures.",
    href: "/services/software-development",
    cta: "Learn More",
    icon: Code2,
    featured: false,
  },
  {
    title: "AI Solutions",
    body: "Integrating Large Language Models and predictive analytics into your existing business workflows.",
    href: "/services/ai-solutions",
    cta: "Explore AI",
    icon: Brain,
    featured: true,
  },
  {
    title: "Cloud Consulting",
    body: "Optimization, migration, and architecture design for scalable multi-cloud enterprise environments.",
    href: "/services/cloud-services",
    cta: "View Services",
    icon: Cloud,
    featured: false,
  },
  {
    title: "ERP/CRM",
    body: "Deploying unified resource planning systems that connect every department in real-time.",
    href: "/solutions",
    cta: "Enterprise Suite",
    icon: Network,
    featured: false,
  },
];

/** Stitch homepage: Strategic Transformation Pillars */
export function FeaturedServicesSection() {
  return (
    <StitchSection>
      <div className="mb-12 text-center md:text-left max-w-xl md:max-w-none">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
          Strategic Transformation Pillars
        </h2>
        <p className="text-[#ccc3d8] leading-relaxed max-w-xl">
          Comprehensive service architecture designed to scale with your enterprise ambitions.
        </p>
      </div>

      <StitchGrid cols={4}>
        {pillars.map((p, i) => {
          const Icon = p.icon;
          return (
            <StitchReveal key={p.title} delay={i * 0.05}>
              <StitchCard
                className={`h-full flex flex-col ${
                  p.featured
                    ? "border-[#7c3aed]/40 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                    : ""
                }`}
              >
                <StitchIconBox className="mb-6">
                  <Icon className="h-6 w-6" />
                </StitchIconBox>
                <h3 className="font-display text-xl font-semibold text-white mb-3">{p.title}</h3>
                <p className="text-sm text-[#ccc3d8] leading-relaxed flex-grow">{p.body}</p>
                <Link
                  href={p.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-mono text-[#d2bbff] hover:underline"
                >
                  {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </StitchCard>
            </StitchReveal>
          );
        })}
      </StitchGrid>
    </StitchSection>
  );
}
