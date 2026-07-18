import { Link } from "@/i18n/routing";
import { enterpriseSolutions } from "@/lib/data/enterprise-solutions";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export default function SolutionsPage() {
  const core = enterpriseSolutions.filter((s) => s.category === "core");
  const modules = enterpriseSolutions.filter((s) => s.category === "module");

  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Enterprise</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Enterprise Solutions</h1>
          <p className="mt-4 text-lg text-muted">
            ERP, EAM, ESM, FSM, and modular operations software — designed to scale with your organization.
          </p>
        </Reveal>

        <Reveal>
          <h2 className="font-display text-2xl font-semibold mb-8">Core platforms</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {core.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.03}>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <h2 className="font-display text-2xl font-semibold mb-8">Additional modules</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {modules.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.03}>
              <div className="space-y-2">
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Button asChild size="lg">
          <Link href="/contact">Discuss your enterprise stack</Link>
        </Button>
      </div>
    </div>
  );
}
