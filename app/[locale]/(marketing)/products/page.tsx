import { Link } from "@/i18n/routing";
import { productCategories } from "@/lib/data/products";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRight } from "lucide-react";
import { CatalogGrid } from "@/components/commerce/catalog-grid";

export default function ProductsPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Marketplace</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Products</h1>
          <p className="mt-4 text-lg text-muted">
            Domains, hosting, software, cloud, security, and email — purchase and manage from one account.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-10 mb-16">
          {productCategories.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 0.04}>
              <Link href={`/products/${cat.slug}`} className="group block space-y-4 border-b border-white/10 pb-10">
                <h2 className="font-display text-2xl font-semibold group-hover:text-accent transition-colors flex items-center gap-2">
                  {cat.title}
                  <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h2>
                <p className="text-muted leading-relaxed">{cat.description}</p>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <h2 className="font-display text-2xl font-bold mb-2">Buy online</h2>
          <p className="text-muted mb-6">Live catalog SKUs — add to cart after login.</p>
        </Reveal>
        <CatalogGrid />
      </div>
    </div>
  );
}
