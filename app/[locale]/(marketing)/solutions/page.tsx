import { Link } from "@/i18n/routing";
import { enterpriseSolutions } from "@/lib/data/enterprise-solutions";
import { Reveal } from "@/components/motion/reveal";
import { PageHero } from "@/components/ui/page-hero";
import { QuoteDialog } from "@/components/forms/quote-dialog";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Enterprise Solutions | MernCrest",
  description:
    "ERP, EAM, ESM, FSM, and modular operations software from MernCrest — designed to scale with your organization.",
};

export default function SolutionsPage() {
  const core = enterpriseSolutions.filter((s) => s.category === "core");
  const modules = enterpriseSolutions.filter((s) => s.category === "module");

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Enterprise"
        title="Enterprise Solutions"
        description="ERP, EAM, ESM, FSM, and modular operations software — designed to scale with your organization."
      >
        <QuoteDialog formType="solutions" label="Request a Demo" />
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-semibold mb-6 text-foreground">Core platforms</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {core.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.03}>
                <div className="h-full stitch-card stitch-card-hover">
                  <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{s.description}</p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-1 text-sm text-stitch-glow hover:text-violet-200"
                  >
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-semibold mb-6 text-foreground">
              Additional modules
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.03}>
                <div className="h-full stitch-card stitch-card-hover">
                  <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <QuoteDialog formType="solutions" label="Request a Demo" />
          <Link
            href="/contact"
            className="inline-flex items-center gap-1 rounded-full border border-stitch-outline px-6 py-2.5 text-sm font-medium text-foreground hover:border-violet-500/40"
          >
            Discuss your enterprise stack <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
