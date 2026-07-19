import { Link } from "@/i18n/routing";
import { industries } from "@/lib/data/industries";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";

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
    <div className="stitch-page">
      <PageHero
        eyebrow="Industries"
        title="Built for every sector"
        description="Tailored digital platforms for Sri Lankan and regional businesses across industries."
      />
      <div className="stitch-page-body">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind) => (
            <Link
              key={ind.slug}
              href={`/solutions/${solutionSlugMap[ind.slug] || "erp"}`}
              className="stitch-card stitch-card-hover group block"
            >
              <h2 className="font-display text-xl font-semibold text-white inline-flex items-center gap-2">
                {ind.title}
                <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">{ind.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
