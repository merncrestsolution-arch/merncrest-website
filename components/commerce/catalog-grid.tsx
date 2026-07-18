"use client";

import { useEffect, useState } from "react";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { Reveal } from "@/components/motion/reveal";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  billingPeriod: string;
};

export function CatalogGrid({ category }: { category?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = category ? `?category=${encodeURIComponent(category)}` : "";
    fetch(`/api/catalog${q}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, [category]);

  if (loading) {
    return <p className="text-sm text-muted mt-8">Loading catalog…</p>;
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted mt-8">
        No sellable SKUs in this category yet. Seed the database or browse all products after setup.
      </p>
    );
  }

  return (
    <div className="mt-12 grid md:grid-cols-2 gap-8">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={i * 0.04}>
          <div className="space-y-3 border-b border-white/10 pb-8">
            <h3 className="font-display text-xl font-semibold">{p.name}</h3>
            <p className="text-sm text-muted leading-relaxed">{p.description}</p>
            <AddToCartButton product={p} />
          </div>
        </Reveal>
      ))}
    </div>
  );
}
