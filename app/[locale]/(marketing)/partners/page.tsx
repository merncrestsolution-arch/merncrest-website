import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  Handshake,
  Layers,
  ShieldCheck,
  Sparkles,
  Network,
} from "lucide-react";
import { partners } from "@/lib/data/resources";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Partners | MERNcrest Solutions",
  description:
    "Technology and infrastructure partners powering MernCrest cloud consulting, reseller marketplace, and enterprise delivery.",
};

const pillars = [
  {
    icon: Layers,
    title: "Technology stack",
    desc: "Cloud, security, and productivity platforms that underpin our delivery and marketplace.",
  },
  {
    icon: Network,
    title: "Reseller network",
    desc: "Domains, hosting, VPS, SSL, and email provisioned through priority-ordered provider APIs.",
  },
  {
    icon: Handshake,
    title: "Go-to-market",
    desc: "Referral and co-sell motions for agencies and integrators who want enterprise-ready outcomes.",
  },
];

const steps = [
  {
    step: "01",
    title: "Align",
    desc: "Share your product, region, and commercial model with our partnerships team.",
  },
  {
    step: "02",
    title: "Integrate",
    desc: "We connect APIs, pricing rules, and support workflows into the MernCrest platform.",
  },
  {
    step: "03",
    title: "Grow",
    desc: "Launch with joint GTM, portal activation, and shared customer success coverage.",
  },
];

export default function PartnersPage() {
  const categories = Array.from(new Set(partners.map((p) => p.category)));

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Partner ecosystem"
        title="Built with world-class platforms"
        description="MernCrest partners with trusted cloud, security, and productivity providers — so your stack stays secure, scalable, and supportable without locking you into a single vendor."
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-stitch-primary text-[#ede0ff] hover:opacity-90"
          >
            <Link href="/contact">
              Become a partner
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-xl border-stitch-outline bg-glass text-foreground hover:border-stitch-primary"
          >
            <Link href="/cloud">Explore cloud services</Link>
          </Button>
        </div>
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg pb-24">
        <section className="stitch-stack-md">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stitch-glow mb-3">
                Why partner with us
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Three partnership tracks
              </h2>
              <p className="mt-3 text-muted leading-relaxed">
                Whether you sell infrastructure, productivity, or services — we plug you into a
                multi-tenant platform with CRM, portal, and finance already wired in.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="stitch-card stitch-card-hover h-full relative overflow-hidden">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-violet-500/10 blur-[40px]" />
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-stitch-glow">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="stitch-stack-md">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="max-w-2xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stitch-glow mb-3">
                  Trusted platforms
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  Infrastructure & product partners
                </h2>
                <p className="mt-3 text-muted leading-relaxed">
                  Logo-first ecosystem — the same platforms that power our consulting, reseller
                  marketplace, and customer portal activations.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-stitch-outline bg-stitch-bg px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {partners.map((p, i) => (
              <Reveal key={p.name} delay={Math.min(i * 0.04, 0.28)}>
                <article className="group stitch-card stitch-card-hover h-full !p-5 flex flex-col relative overflow-hidden">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(90deg, transparent, #${p.color}, transparent)`,
                    }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stitch-outline bg-stitch-bg group-hover:border-stitch-primary/50 transition-colors">
                      <BrandLogo slug={p.slug} name={p.name} color={p.color} size={30} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {p.category}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{p.name}</h3>
                  <p className="mt-1 text-xs font-mono text-stitch-glow">{p.role}</p>
                  <p className="mt-3 text-sm text-muted leading-relaxed flex-1">{p.blurb}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="stitch-stack-md">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stitch-glow mb-3">
                Partner program
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                How onboarding works
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <Reveal key={s.step} delay={i * 0.06}>
                <div className="relative rounded-2xl border border-stitch-outline bg-stitch-low/60 p-6 h-full">
                  <span className="font-display text-4xl font-extrabold text-foreground/10 absolute top-4 right-5">
                    {s.step}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stitch-primary/20 text-stitch-glow mb-4">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal>
          <div className="stitch-card !py-12 sm:!py-14 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 brand-mesh opacity-50" aria-hidden />
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[28rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[90px]" />
            <div className="relative z-10 mx-auto max-w-xl stitch-stack-md">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-stitch-glow">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Ready to join the ecosystem?
              </h2>
              <p className="text-muted leading-relaxed">
                Tell us about your platform or agency. We&apos;ll map integrations, margins, and
                joint go-to-market — without rebuilding what already works.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-stitch-primary text-[#ede0ff] hover:opacity-90"
                >
                  <Link href="/contact">
                    Talk to partnerships
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-stitch-outline bg-transparent text-foreground hover:border-stitch-primary"
                >
                  <Link href="/solutions">Explore solutions</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
