import { prisma } from "@/lib/db";
import { getPriceBookCatalogLines } from "@/lib/data/price-book";

/** Lightweight keyword match against catalog — no embeddings in v1. */
export async function retrieveCatalogContext(query: string, take = 8): Promise<string> {  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3)
    .slice(0, 8);

  const products = await prisma.product.findMany({
    where: { active: true },
    take: 40,
    select: {
      name: true,
      slug: true,
      description: true,
      category: true,
      priceCents: true,
      currency: true,
    },
  });

  const services = await prisma.serviceCatalogItem
    .findMany({
      where: { active: true },
      take: 30,
      select: { name: true, description: true, category: true },
    })
    .catch(() => [] as { name: string; description: string | null; category: string | null }[]);

  const scored = [
    ...products.map((p) => {
      const hay = `${p.name} ${p.description || ""} ${p.category || ""}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? 2 : 0), 0) + 1;
      const price = ((p.priceCents || 0) / 100).toFixed(0);
      return {
        score,
        line: `- ${p.name} (${p.category || "product"}): ${p.description?.slice(0, 120) || "—"} · from ${p.currency || "LKR"} ${price}`,
      };
    }),
    ...services.map((s) => {
      const hay = `${s.name} ${s.description || ""} ${s.category || ""}`.toLowerCase();
      const score = words.reduce((acc, w) => acc + (hay.includes(w) ? 2 : 0), 0) + 1;
      return {
        score,
        line: `- ${s.name} (${s.category || "service"}): ${s.description?.slice(0, 120) || "—"}`,
      };
    }),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, take);

  const priceBook = getPriceBookCatalogLines().join("\n");

  if (!scored.length) {
    return `${priceBook}\n\nNo marketplace catalog items matched. Offer to connect to a human for a custom quote.`;
  }
  return `${scored.map((s) => s.line).join("\n")}\n\nOfficial price book (LKR):\n${priceBook}`;
}