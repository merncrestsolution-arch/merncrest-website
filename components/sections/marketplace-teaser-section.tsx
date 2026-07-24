"use client";

import { Link } from "@/i18n/routing";
import { Globe, Server, HardDrive, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";
import { StitchSection, StitchHeader, StitchReveal } from "@/components/ui/stitch";
import { DomainSearch } from "@/components/domains/domain-search";

/** Stitch homepage: MernCrest Marketplace (reseller catalog teaser) */
const services = [
  {
    icon: Globe,
    title: "Domains",
    body: "Register and manage your global digital identity with instant setup.",
    href: "/domains",
  },
  {
    icon: Server,
    title: "Cloud Hosting",
    body: "Performance-optimized hosting on resilient, managed infrastructure.",
    href: "/hosting",
  },
  {
    icon: HardDrive,
    title: "Dedicated VPS",
    body: "Isolated, high-power compute for demanding enterprise workloads.",
    href: "/cloud",
  },
  {
    icon: ShieldCheck,
    title: "SSL Security",
    body: "Encrypt and protect your traffic with trusted SSL certificates.",
    href: "/products/security",
  },
  {
    icon: Mail,
    title: "Business Email",
    body: "Professional mailboxes and productivity suite for your team.",
    href: "/products/email",
  },
];

export function MarketplaceTeaserSection() {
  return (
    <StitchSection className="bg-stitch-low/30 py-10 md:py-14">
      <StitchHeader
        title="Secure Your Domain"
        description="Find and register your perfect domain in seconds — then scale with hosting, VPS, SSL, and business email, all managed by MernCrest."
        align="center"
        className="mb-6"
      />

      {/* Domain search */}
      <StitchReveal>
        <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-stitch-outline bg-stitch-surface p-3 shadow-[var(--stitch-card-shadow)]">
          <DomainSearch />
          <p className="mt-3 px-2 pb-1 font-mono text-[12px] text-muted-foreground">
            Popular: .ai · .cloud · .io · .lk · .tech
          </p>
        </div>
      </StitchReveal>

      {/* Service cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {services.map((s, i) => {
          const Icon = s.icon;
          return (
            <StitchReveal key={s.title} delay={i * 0.05}>
              <Link
                href={s.href}
                className="stitch-card stitch-card-hover group flex h-full flex-col text-center"
              >
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stitch-primary-soft text-stitch-primary transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <h4 className="mb-2 font-display text-base font-semibold text-foreground">
                  {s.title}
                </h4>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted">{s.body}</p>
                <span className="inline-flex items-center justify-center gap-1 font-mono text-[12px] font-medium text-stitch-glow group-hover:underline">
                  Explore <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </StitchReveal>
          );
        })}
      </div>
    </StitchSection>
  );
}
