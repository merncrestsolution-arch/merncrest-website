"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, MessageSquare, Phone, Globe, LayoutDashboard } from "lucide-react";
import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchIconBox,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

const pillars = [
  {
    icon: Globe,
    title: "Public Website",
    body: "Brand, marketplace, knowledge base, and self-serve registration.",
  },
  {
    icon: LayoutDashboard,
    title: "Customer Portal",
    body: "Orders, domains, hosting, invoices, tickets, and downloads.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp & Chat",
    body: "AI multilingual care synced to CRM in English, Tamil, and Sinhala.",
  },
  {
    icon: Phone,
    title: "Customer Care IVR",
    body: "Landline IVR, callbacks, and tickets when agents are offline.",
  },
];

export function PlatformSection() {
  const t = useTranslations("platformSnippet");

  return (
    <StitchSection mesh>
      <StitchHeader
        eyebrow={t("badge")}
        title={t("title")}
        description={t("description")}
        className="mb-12"
      />
      <StitchGrid cols={4}>
        {pillars.map((p, i) => {
          const Icon = p.icon;
          return (
            <StitchReveal key={p.title} delay={i * 0.08}>
              <StitchCard className="h-full">
                <StitchIconBox className="mb-4">
                  <Icon className="h-5 w-5" />
                </StitchIconBox>
                <h3 className="font-display text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{p.body}</p>
              </StitchCard>
            </StitchReveal>
          );
        })}
      </StitchGrid>
      <StitchReveal className="mt-12">
        <Link
          href="/solutions"
          className="inline-flex items-center gap-2 font-medium text-violet-300 hover:text-violet-200"
        >
          Explore enterprise solutions <ArrowRight className="h-4 w-4" />
        </Link>
      </StitchReveal>
    </StitchSection>
  );
}
