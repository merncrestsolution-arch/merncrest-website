import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Globe2, Users2, Zap } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("about")} | MERNcrest Solutions`,
    description: "Learn more about MERNcrest Solutions, our mission, vision, and the core values that drive our technology services.",
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
    { title: "Innovation First", icon: Zap, desc: "We constantly explore bleeding-edge tech to give our clients the ultimate advantage." },
    { title: "Client Success", icon: Users2, desc: "Your growth is our metric for success. We partner deeply to ensure maximum ROI." },
    { title: "Global Standards", icon: Globe2, desc: "World-class code quality, strict security protocols, and international compliances." }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center mix-blend-overlay opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background" />
        
        <div className="container-wide relative z-10 text-center max-w-4xl mx-auto">
          <p className="text-accent font-mono text-sm uppercase tracking-wider mb-4">Our Story</p>
          <h1 className="text-5xl lg:text-7xl font-bold font-display mb-6 text-balance leading-tight">
            Engineering the <span className="gradient-text">Future</span> of Business.
          </h1>
          <p className="text-xl text-muted leading-relaxed">
            MERNcrest Solutions is an elite software engineering agency based in Sri Lanka, dedicated to architecting scalable, secure, and beautiful digital experiences for modern enterprises.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-secondary/30 border-y border-white/5">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
            <div className="glass-card p-10 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 blur-[60px] rounded-full" />
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-muted text-lg leading-relaxed">
                To empower businesses with transformative technology solutions that drastically reduce operational friction, unlock new revenue streams, and create unforgettable experiences for their customers.
              </p>
            </div>
            <div className="glass-card p-10 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent-alt/10 blur-[60px] rounded-full" />
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-muted text-lg leading-relaxed">
                To be the undisputed leader in software innovation across South Asia, recognized globally for engineering excellence, agile delivery, and unparalleled client success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display">Core Values</h2>
            <p className="text-muted text-lg">The foundational principles that guide every line of code we write and every strategy we build.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-accent/30 transition-colors group">
                <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <v.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                <p className="text-muted leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-accent/5">
        <div className="container-wide text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to scale your business?</h2>
          <p className="text-xl text-muted mb-8">Join the growing list of enterprises that trust MERNcrest with their digital transformation.</p>
          <Button asChild size="lg" className="h-14 px-8 text-base shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Link href="/contact">Get in Touch <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
