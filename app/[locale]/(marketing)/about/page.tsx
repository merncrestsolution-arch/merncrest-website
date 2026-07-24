import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { ArrowRight, Globe2, Users2, Zap, Search, PenTool, Code2, Rocket, LifeBuoy, CheckCircle2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const title = `${t("about")} | MernCrest Solutions`;
  const description =
    "MernCrest Solutions — a Sri Lankan enterprise technology company delivering custom software, cloud, and AI, plus a provider-partner domain & hosting marketplace.";
  return {
    title,
    description,
    alternates: { canonical: "https://merncrest.lk/about" },
    openGraph: { title, description, url: "https://merncrest.lk/about", type: "website" },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const values = [
    {
      title: "Build what fits",
      icon: Zap,
      desc: "We design software around your workflows instead of forcing you into rigid, off-the-shelf tools.",
    },
    {
      title: "Client partnership",
      icon: Users2,
      desc: "We work as an extension of your team — clear communication, honest timelines, and steady delivery.",
    },
    {
      title: "Engineering discipline",
      icon: Globe2,
      desc: "Type-safe code, validated APIs, RBAC, and audit logging baked into every module we ship.",
    },
  ];

  const whyChoose = [
    "MERN & TypeScript engineering — MongoDB/PostgreSQL, Express/Node, React, Next.js",
    "Cloud on AWS with Docker, Nginx, and Cloudflare — deployment and consulting",
    "AI solutions: LLM integration, automation, and analytics on your own data",
    "Support in English, Tamil, and Sinhala (EN / TA / SI)",
    "Domain & hosting marketplace resold through trusted provider partners",
    "In-house Portal, CRM, and ERP so your operations stay connected",
  ];

  const techStack = [
    "Next.js", "React", "Node.js", "TypeScript", "PostgreSQL",
    "Prisma", "Tailwind CSS", "AWS", "Docker", "Nginx", "Cloudflare", "Redis",
  ];

  const process = [
    { title: "Discovery", icon: Search, desc: "We map goals, users, and constraints before writing code." },
    { title: "Design", icon: PenTool, desc: "UX flows and architecture agreed with you up front." },
    { title: "Build", icon: Code2, desc: "Iterative delivery with type-safe, reviewed code." },
    { title: "Deploy", icon: Rocket, desc: "Ship to AWS with monitoring and rollback safety." },
    { title: "Support", icon: LifeBuoy, desc: "Ongoing maintenance, updates, and enhancements." },
  ];

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Our Story"
        title="Engineering the future of business"
        description="MernCrest Solutions is an enterprise technology company based in Sri Lanka — delivering custom software, ERP, CRM, AI solutions, business automation, digital marketing, and cloud consulting. We also operate a domain & hosting marketplace that resells services through provider partners (we do not own hosting infrastructure)."
      />

      <div className="stitch-page-body stitch-stack-lg">
        <div className="relative overflow-hidden rounded-xl border border-stitch-outline h-52 sm:h-64">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80"
            alt="MernCrest team collaboration"
            fill
            className="object-cover opacity-70"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stitch-bg via-transparent to-transparent" />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="stitch-card relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/10 blur-[50px]" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted leading-relaxed">
              To empower businesses with transformative technology solutions that drastically reduce
              operational friction, unlock new revenue streams, and create unforgettable experiences
              for their customers.
            </p>
          </div>
          <div className="stitch-card relative overflow-hidden">
            <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-[50px]" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">Our Vision</h2>
            <p className="text-muted leading-relaxed">
              To be a trusted engineering partner for businesses in Sri Lanka and the region —
              known for practical, well-built software and honest, long-term relationships.
            </p>
          </div>
        </div>

        {/* Why choose MernCrest */}
        <div>
          <div className="max-w-2xl mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Why choose MernCrest
            </h2>
            <p className="text-muted">
              Real capabilities we deliver today — no buzzwords, just what we build and support.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {whyChoose.map((item) => (
              <div key={item} className="flex items-start gap-3 stitch-card">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-stitch-glow mt-0.5" />
                <span className="text-sm text-muted leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How we work */}
        <div>
          <div className="max-w-2xl mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              How we work
            </h2>
            <p className="text-muted">A clear, repeatable path from idea to live, supported software.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {process.map((step, i) => (
              <div key={step.title} className="stitch-card stitch-card-hover">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-stitch-glow">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-mono text-stitch-glow mb-1">Step {i + 1}</p>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div>
          <div className="max-w-2xl mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Our tech stack
            </h2>
            <p className="text-muted">The tools we build and run production systems on.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full border border-stitch-outline bg-white/[0.03] font-mono text-xs text-muted"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="max-w-2xl mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Core Values
            </h2>
            <p className="text-muted">
              The foundational principles that guide every line of code we write and every strategy
              we build.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {values.map((v) => (
              <div key={v.title} className="stitch-card stitch-card-hover">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-stitch-glow">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="stitch-card text-center !py-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" aria-hidden />
          <div className="relative z-10 max-w-xl mx-auto stitch-stack-md">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Ready to scale your business?
            </h2>
            <p className="text-muted">
              Tell us what you&apos;re building and we&apos;ll help you plan the right approach —
              software, cloud, or a marketplace account for domains and hosting.
            </p>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/contact">
                Get in Touch <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
