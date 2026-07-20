"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Rocket, Shield, Database } from "lucide-react";
import { serviceMenuItems } from "@/lib/navigation";
import { PageHero } from "@/components/ui/page-hero";
import {
  StitchSection,
  StitchCard,
  StitchIconBox,
  StitchReveal,
  StitchGrid,
  StitchHeader,
} from "@/components/ui/stitch";

const metrics = [
  { value: "99.9%", label: "UPTIME SLA", icon: BarChart3 },
  { value: "2.4s", label: "AVG. DEPLOY", icon: Rocket },
  { value: "SOC-2", label: "COMPLIANCE", icon: Shield },
  { value: "PB-SCALE", label: "DATA ARCH", icon: Database },
];

/** Stitch screen: Services - MernCrest */
export function ServicesSection({ hideViewAll = false }: { hideViewAll?: boolean }) {
  const t = useTranslations("servicesMenu");
  const tSection = useTranslations("servicesSnippet");
  const tCommon = useTranslations("common");

  return (
    <div>
      {hideViewAll ? (
        <PageHero
          eyebrow="Enterprise Technology"
          title="Enterprise Technology Services"
          description={tSection("description")}
          align="left"
        >
          <div className="flex flex-col lg:flex-row gap-10 w-full items-start">
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-[#7c3aed]">
                <Link href="/contact">Consult an Expert</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-[#4a4455]">
                <Link href="/solutions">View Roadmap</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md lg:ml-auto">
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="stitch-card !py-4">
                    <Icon className="h-4 w-4 text-[#d2bbff] mb-2" />
                    <p className="font-display text-2xl font-bold text-white">{m.value}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#958da1] mt-1">
                      {m.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </PageHero>
      ) : (
        <StitchSection className="!pb-4">
          <StitchHeader
            eyebrow={tSection("badge")}
            title={tSection("title")}
            description={tSection("description")}
            align="center"
          />
        </StitchSection>
      )}

      <StitchSection className={hideViewAll ? "!pt-10" : "!pt-4"}>
        {hideViewAll && (
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Core Competencies
              </h2>
              <p className="mt-2 text-sm text-[#ccc3d8]">
                Modular capabilities engineered for enterprise scale.
              </p>
            </div>
          </div>
        )}
        <StitchGrid cols={3}>
          {serviceMenuItems.map((item, index) => {
            const Icon = item.icon;
            const service = item.key;
            return (
              <StitchReveal key={service} delay={index * 0.04}>
                <Link href={item.href} className="block h-full">
                  <StitchCard className="h-full">
                    <StitchIconBox className="mb-5 h-12 w-12">
                      <Icon className="h-6 w-6" />
                    </StitchIconBox>
                    <h3 className="font-display text-lg font-semibold text-white mb-2">
                      {t(`${service}.title`)}
                    </h3>
                    <p className="text-sm text-[#ccc3d8] leading-relaxed mb-4">
                      {t(`${service}.description`)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-[#d2bbff]">
                      Explore Capability <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </StitchCard>
                </Link>
              </StitchReveal>
            );
          })}
        </StitchGrid>

        {!hideViewAll && (
          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/services">
                {tCommon("viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {hideViewAll && (
          <div className="mt-16 stitch-card text-center !py-14 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
            <h2 className="relative z-10 font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to scale your Intelligence?
            </h2>
            <p className="relative z-10 text-[#ccc3d8] mb-8 max-w-xl mx-auto">
              Schedule a diagnostic session with our architectural consultants.
            </p>
            <div className="relative z-10 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full bg-[#7c3aed]">
                <Link href="/contact">Consult an Expert</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-[#4a4455]">
                <Link href="/solutions">Enterprise Solutions</Link>
              </Button>
            </div>
          </div>
        )}
      </StitchSection>
    </div>
  );
}
