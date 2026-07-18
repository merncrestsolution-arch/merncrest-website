"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRight, MessageSquare, Phone, Globe, LayoutDashboard } from "lucide-react";

const pillars = [
  { icon: Globe, title: "Public Website", body: "Brand, marketplace, knowledge base, and self-serve registration." },
  { icon: LayoutDashboard, title: "Customer Portal", body: "Orders, domains, hosting, invoices, tickets, and downloads." },
  { icon: MessageSquare, title: "WhatsApp & Chat", body: "AI multilingual care synced to CRM in English, Tamil, and Sinhala." },
  { icon: Phone, title: "Customer Care IVR", body: "Landline IVR, callbacks, and tickets when agents are offline." },
];

export function PlatformSection() {
  const t = useTranslations("platformSnippet");

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 ocean-mesh opacity-60 pointer-events-none" />
      <div className="container-wide relative z-10">
        <Reveal className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">{t("badge")}</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-balance">{t("title")}</h2>
          <p className="mt-4 text-muted text-lg leading-relaxed">{t("description")}</p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{p.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-12">
          <Link href="/solutions" className="inline-flex items-center gap-2 text-accent font-medium hover:opacity-80">
            Explore enterprise solutions <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
