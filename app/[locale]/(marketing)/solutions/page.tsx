import { Link } from "@/i18n/routing";
import { enterpriseSolutions } from "@/lib/data/enterprise-solutions";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { ArrowRight } from "lucide-react";

export default function SolutionsPage() {
  const core = enterpriseSolutions.filter((s) => s.category === "core");
  const modules = enterpriseSolutions.filter((s) => s.category === "module");

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Enterprise"
        title="Enterprise Solutions"
        description="ERP, EAM, ESM, FSM, and modular operations software — designed to scale with your organization."
      />

      <div className="container-wide section-padding pt-10">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold mb-8 text-white">Core platforms</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {core.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.03}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-violet-400/35">
                <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{s.description}</p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200"
                >
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <h2 className="font-display text-2xl font-semibold mb-8 text-white">Additional modules</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {modules.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.03}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-violet-400/35">
                <h3 className="font-display text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{s.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Button asChild size="lg" className="rounded-full">
          <Link href="/contact">Discuss your enterprise stack</Link>
        </Button>
      </div>
    </div>
  );
}
