import { Link } from "@/i18n/routing";
import { productCategories } from "@/lib/data/products";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRight } from "lucide-react";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { PageHero } from "@/components/ui/page-hero";

export default function ProductsPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Marketplace"
        title="Infrastructure Marketplace"
        description="Domains, hosting, software, cloud, security, and email — purchase and manage from one account."
      />

      <div className="stitch-page-body stitch-stack-lg">
        <div className="grid md:grid-cols-2 gap-5">
          {productCategories.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 0.04}>
              <Link
                href={`/products/${cat.slug}`}
                className="group block h-full stitch-card stitch-card-hover"
              >
                <h2 className="font-display text-2xl font-semibold text-white group-hover:text-violet-200 transition-colors flex items-center gap-2">
                  {cat.title}
                  <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h2>
                <p className="mt-3 text-muted leading-relaxed">{cat.description}</p>
              </Link>
            </Reveal>
          ))}
        </div>

        <div>
          <Reveal>
            <h2 className="font-display text-2xl font-bold mb-2 text-white">Buy online</h2>
            <p className="text-muted mb-6">Live catalog SKUs — add to cart after login.</p>
          </Reveal>
          <CatalogGrid />
        </div>
      </div>
    </div>
  );
}
