import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getProductCategory, productCategories } from "@/lib/data/products";
import { Button } from "@/components/ui/button";
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
    <div className="pt-28 section-padding">
      <div className="container-wide max-w-3xl">
        <Reveal>
          <Link href="/products" className="text-sm text-accent hover:opacity-80">
            ← Products
          </Link>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold">{cat.title}</h1>
          <p className="mt-4 text-lg text-muted leading-relaxed">{cat.description}</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 space-y-3">
          <h2 className="font-display text-xl font-semibold">Included capabilities</h2>
          <ul className="space-y-2">
            {cat.items.map((item) => (
              <li key={item} className="flex items-center gap-3 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <CatalogGrid category={category} />

        <Reveal delay={0.15} className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/contact">Request custom quote</Link>
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
