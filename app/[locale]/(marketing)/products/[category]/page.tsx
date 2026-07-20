import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getProductCategory, productCategories } from "@/lib/data/products";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { CatalogGrid } from "@/components/commerce/catalog-grid";

export function generateStaticParams() {
  return productCategories.map((c) => ({ category: c.slug }));
}

export default async function ProductCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getProductCategory(category);
  if (!cat) notFound();

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Products"
        title={cat.title}
        description={cat.description}
        align="left"
      >
        <Link href="/products" className="text-sm text-violet-300 hover:text-violet-200">
          ← All products
        </Link>
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <Reveal>
          <h2 className="font-display text-xl font-semibold text-white mb-4">
            Included capabilities
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {cat.items.map((item) => (
              <li key={item} className="stitch-card !py-4 flex items-center gap-3 text-sm text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <CatalogGrid category={category} />

        <Button asChild variant="outline" className="rounded-full">
          <Link href="/contact">Request custom quote</Link>
        </Button>
      </div>
    </div>
  );
}
