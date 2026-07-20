import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { ArrowRight, Globe2, Users2, Zap } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("about")} | MERNcrest Solutions`,
    description:
      "Learn more about MERNcrest Solutions, our mission, vision, and the core values that drive our technology services.",
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
      title: "Innovation First",
      icon: Zap,
      desc: "We constantly explore bleeding-edge tech to give our clients the ultimate advantage.",
    },
    {
      title: "Client Success",
      icon: Users2,
      desc: "Your growth is our metric for success. We partner deeply to ensure maximum ROI.",
    },
    {
      title: "Global Standards",
      icon: Globe2,
      desc: "World-class code quality, strict security protocols, and international compliances.",
    },
  ];

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Our Story"
        title="Engineering the future of business"
        description="MernCrest Solutions is an enterprise technology company based in Sri Lanka — delivering custom software, ERP, CRM, AI solutions, business automation, digital marketing, and cloud consulting. We also operate a domain & hosting marketplace that resells services through provider partners (we do not own hosting infrastructure)."
      />

      <div className="stitch-page-body stitch-stack-lg">
        <div className="relative overflow-hidden rounded-xl border border-white/10 h-52 sm:h-64">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80"
            alt="MernCrest team collaboration"
            fill
            className="object-cover opacity-70"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--stitch-bg)] via-transparent to-transparent" />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="stitch-card relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-500/10 blur-[50px]" />
            <h2 className="font-display text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-muted leading-relaxed">
              To empower businesses with transformative technology solutions that drastically reduce
              operational friction, unlock new revenue streams, and create unforgettable experiences
              for their customers.
            </p>
          </div>
          <div className="stitch-card relative overflow-hidden">
            <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-[50px]" />
            <h2 className="font-display text-2xl font-bold text-white mb-4">Our Vision</h2>
            <p className="text-muted leading-relaxed">
              To be the undisputed leader in software innovation across South Asia, recognized
              globally for engineering excellence, agile delivery, and unparalleled client success.
            </p>
          </div>
        </div>

        <div>
          <div className="max-w-2xl mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
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
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="stitch-card text-center !py-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" aria-hidden />
          <div className="relative z-10 max-w-xl mx-auto stitch-stack-md">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Ready to scale your business?
            </h2>
            <p className="text-muted">
              Join the growing list of enterprises that trust MERNcrest with their digital
              transformation.
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
