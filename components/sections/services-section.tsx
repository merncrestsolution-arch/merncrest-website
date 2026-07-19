"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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

export function ServicesSection({ hideViewAll = false }: { hideViewAll?: boolean }) {
  const t = useTranslations("servicesMenu");
  const tSection = useTranslations("servicesSnippet");
  const tCommon = useTranslations("common");

  return (
    <div>
      {hideViewAll ? (
        <PageHero
          eyebrow={tSection("badge")}
          title={tSection("title")}
          description={tSection("description")}
        />
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
                    <h3 className="mb-3 text-xl font-semibold text-white">
                      {t(`${service}.title`)}
                    </h3>
                    <p className="mb-4 text-sm text-muted">{t(`${service}.description`)}</p>
                    <div className="flex items-center text-sm font-medium text-violet-300">
                      {tCommon("learnMore")}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </StitchCard>
                </Link>
              </StitchReveal>
            );
          })}
        </StitchGrid>

        {!hideViewAll && (
          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/services">
                {tCommon("viewAll")} Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </StitchSection>
    </div>
  );
}
