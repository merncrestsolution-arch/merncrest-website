"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Wallet,
  Building2,
  Truck,
  Database,
  Users,
  Store,
  CalendarCheck,
  Cloud,
  Cpu,
  BrainCircuit,
  Boxes,
} from "lucide-react";
import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchIconBox,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

const solutionIcons = {
  ecommerce: ShoppingCart,
  healthcare: HeartPulse,
  education: GraduationCap,
  fintech: Wallet,
  realEstate: Building2,
  logistics: Truck,
  erp: Database,
  crm: Users,
  pos: Store,
  booking: CalendarCheck,
  saas: Cloud,
  iot: Cpu,
  aiml: BrainCircuit,
  blockchain: Boxes,
};

export function SolutionsSection() {
  const t = useTranslations("solutionsMenu");
  const tSection = useTranslations("solutionsSnippet");
  const tCommon = useTranslations("common");

  const featuredSolutions = [
    "ecommerce",
    "healthcare",
    "fintech",
    "education",
    "erp",
    "aiml",
  ] as Array<keyof typeof solutionIcons>;

  return (
    <StitchSection>
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <StitchReveal className="lg:col-span-5">
          <StitchHeader
            eyebrow={tSection("badge")}
            title={tSection("title")}
            description={tSection("description")}
          />
          <Button asChild size="lg" className="mt-8 rounded-full group">
            <Link href="/solutions">
              {tCommon("viewAll")} Solutions
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </StitchReveal>

        <StitchGrid cols={2} className="lg:col-span-7">
          {featuredSolutions.map((solution, index) => {
            const Icon = solutionIcons[solution];
            return (
              <StitchReveal key={solution} delay={index * 0.06}>
                <Link href={`/solutions/${solution.toLowerCase()}`} className="block h-full">
                  <StitchCard className="flex items-start gap-4 h-full">
                    <StitchIconBox>
                      <Icon className="h-5 w-5" />
                    </StitchIconBox>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white mb-1">{t(`${solution}.title`)}</h4>
                      <p className="text-sm text-muted line-clamp-2">
                        {t(`${solution}.description`)}
                      </p>
                    </div>
                  </StitchCard>
                </Link>
              </StitchReveal>
            );
          })}
        </StitchGrid>
      </div>
    </StitchSection>
  );
}
