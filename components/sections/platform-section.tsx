"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CheckCircle2, BrainCircuit, Workflow } from "lucide-react";
import { StitchSection, StitchReveal } from "@/components/ui/stitch";

/** Stitch homepage: solution highlight rows */
export function PlatformSection() {
  return (
    <StitchSection>
      <div className="space-y-20 lg:space-y-28">
        {/* Row 1 — Scalable Software Ecosystems */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <StitchReveal className="relative order-2 lg:order-1">
            <div className="luminous-border relative aspect-[4/3] overflow-hidden rounded-2xl border border-stitch-outline">
              <Image
                src="/section-scalable-architecture.jpg"
                alt="Enterprise software architecture blueprint — microservices, CDN, and encryption"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </StitchReveal>

          <StitchReveal className="order-1 lg:order-2" delay={0.08}>
            <span className="mb-4 block font-mono text-[12px] uppercase tracking-[0.05em] text-stitch-glow">
              Architecture First
            </span>
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Scalable Software Ecosystems
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-muted">
              We build digital environments that grow with your ambitions. Modular architecture keeps
              performance responsive as your user base expands.
            </p>
            <ul className="mb-10 space-y-4">
              {[
                "Microservices-based infrastructure",
                "Global CDN deployment",
                "Enterprise-grade encryption protocols",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-stitch-glow" />
                  {item}
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-stitch-primary px-8 text-stitch-glow hover:bg-stitch-primary/10"
            >
              <Link href="/solutions">Explore the Platform</Link>
            </Button>
          </StitchReveal>
        </div>

        {/* Row 2 — AI-Driven Innovation */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <StitchReveal>
            <span className="mb-4 block font-mono text-[12px] uppercase tracking-[0.05em] text-stitch-glow">
              The Intelligent Edge
            </span>
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl">
              AI-Driven Innovation
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-muted">
              Integrate learning models directly into your business logic. We turn raw enterprise data
              into predictive insight that drives smarter decisions at every level.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-stitch-outline bg-stitch-surface-container p-4">
                <BrainCircuit className="mb-2 h-5 w-5 text-stitch-primary" />
                <h4 className="mb-1 font-semibold text-foreground">Predictive Analytics</h4>
                <p className="text-sm text-muted">Forecast trends from your operational data.</p>
              </div>
              <div className="rounded-xl border border-stitch-outline bg-stitch-surface-container p-4">
                <Workflow className="mb-2 h-5 w-5 text-stitch-secondary" />
                <h4 className="mb-1 font-semibold text-foreground">Automated Operations</h4>
                <p className="text-sm text-muted">Reduce manual overhead with smart workflows.</p>
              </div>
            </div>
          </StitchReveal>

          <StitchReveal delay={0.08}>
            <div className="luminous-border relative aspect-[4/3] overflow-hidden rounded-2xl border border-stitch-outline">
              <Image
                src="/section-ai-innovation.jpg"
                alt="AI-driven innovation mind map — machine learning, predictive analytics, automation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </StitchReveal>
        </div>
      </div>
    </StitchSection>
  );
}
