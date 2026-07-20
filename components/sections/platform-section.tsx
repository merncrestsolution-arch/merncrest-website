"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { StitchSection, StitchReveal } from "@/components/ui/stitch";

/** Stitch homepage: Harmonize Your Enterprise Communication */
export function PlatformSection() {
  return (
    <StitchSection>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <StitchReveal className="relative order-2 lg:order-1">
          <div className="relative aspect-square rounded-2xl overflow-hidden luminous-border border border-[#4a4455]">
            <Image
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
              alt="Enterprise AI dashboard visualizations"
              fill
              className="object-cover opacity-80"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-4 -right-2 sm:-right-6 stitch-card max-w-[240px] shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[#25d366] text-lg">✦</span>
              <span className="font-mono text-[12px] text-white">AI Sync Active</span>
            </div>
            <p className="text-[12px] text-[#ccc3d8] leading-relaxed">
              Real-time cross-platform communication unified via MernCrest Intelligence Layer.
            </p>
          </div>
        </StitchReveal>

        <StitchReveal className="order-1 lg:order-2" delay={0.08}>
          <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-[#d2bbff] block mb-4">
            Unified Ecosystem
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-6">
            Harmonize Your Enterprise Communication
          </h2>
          <p className="text-lg text-[#ccc3d8] leading-relaxed mb-8">
            Stop juggling disconnected tools. Our platform unifies CRM data, team communication, and
            customer interactions into a single intelligent stream powered by proprietary AI models.
          </p>
          <ul className="space-y-4 mb-10">
            {[
              "Integrated VoIP and Messaging Systems",
              "Automated Lead Scoring & Sentiment Analysis",
              "Single-Pane-of-Glass Customer Journey",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[#e4e1e7]">
                <CheckCircle2 className="h-5 w-5 text-[#d2bbff] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-[#7c3aed] text-[#d2bbff] hover:bg-[#7c3aed]/10 h-12 px-8"
          >
            <Link href="/contact">Request CRM Demo</Link>
          </Button>
        </StitchReveal>
      </div>
    </StitchSection>
  );
}
