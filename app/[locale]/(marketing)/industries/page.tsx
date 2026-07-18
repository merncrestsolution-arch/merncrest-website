import { Link } from "@/i18n/routing";
import { industries } from "@/lib/data/industries";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRight } from "lucide-react";

const solutionSlugMap: Record<string, string> = {
  ecommerce: "ecommerce",
  healthcare: "healthcare",
  education: "education",
  fintech: "fintech",
  "real-estate": "realestate",
  logistics: "logistics",
  manufacturing: "iot",
  hospitality: "booking",
  government: "saas",
  retail: "pos",
};

export default function IndustriesPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Industries</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Built for every sector</h1>
          <p className="mt-4 text-lg text-muted">
            Tailored digital platforms for Sri Lankan and regional businesses across industries.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {industries.map((ind, i) => (
            <Reveal key={ind.slug} delay={i * 0.04}>
              <Link
                href={`/solutions/${solutionSlugMap[ind.slug] || "erp"}`}
                className="group block space-y-2"
              >
                <h2 className="font-display text-xl font-semibold group-hover:text-accent transition-colors inline-flex items-center gap-2">
                  {ind.title}
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <p className="text-sm text-muted leading-relaxed">{ind.description}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
