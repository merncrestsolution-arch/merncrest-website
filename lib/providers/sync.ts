import { prisma } from "@/lib/db";
import { createAdapter, toCredentials } from "@/lib/providers/registry";
import {
  mapCategoryToMargin,
  priceFromProvider,
} from "@/lib/providers/pricing-engine";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Synchronize hosting / SSL / email / VPS / cloud packages from a provider API
 * into the local Product catalog, applying the Pricing Engine.
 */
export async function syncProviderProducts(providerId: string) {
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) throw new Error("Provider not found");

  await prisma.provider.update({
    where: { id: providerId },
    data: { syncStatus: "SYNCING" },
  });

  try {
    const adapter = createAdapter(toCredentials(provider));
    const packages = await adapter.listPackages();
    let upserted = 0;

    for (const pkg of packages) {
      const category = mapCategoryToMargin(pkg.category);
      const priced = await priceFromProvider(
        pkg.providerPriceCents,
        category,
        provider.defaultMarginCents,
        pkg.currency || "LKR"
      );
      const slug = `${provider.code}-${slugify(pkg.providerProductId || pkg.name)}`;

      await prisma.product.upsert({
        where: { slug },
        create: {
          slug,
          name: pkg.name,
          description: pkg.description,
          category,
          priceCents: priced.sellingPriceCents,
          providerPriceCents: pkg.providerPriceCents,
          currency: pkg.currency || "LKR",
          billingPeriod: pkg.billingPeriod,
          active: true,
          featured: ["hosting", "vps", "cloud"].includes(category),
          sortOrder: upserted + 10,
          providerId: provider.id,
          providerProductId: pkg.providerProductId,
          specsJson: pkg.specs ? JSON.stringify(pkg.specs) : null,
          lastSyncedAt: new Date(),
        },
        update: {
          name: pkg.name,
          description: pkg.description,
          category,
          priceCents: priced.sellingPriceCents,
          providerPriceCents: pkg.providerPriceCents,
          currency: pkg.currency || "LKR",
          billingPeriod: pkg.billingPeriod,
          providerId: provider.id,
          providerProductId: pkg.providerProductId,
          specsJson: pkg.specs ? JSON.stringify(pkg.specs) : null,
          lastSyncedAt: new Date(),
          active: true,
        },
      });
      upserted += 1;
    }

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        syncStatus: "SUCCESS",
        lastSyncedAt: new Date(),
        status: "ACTIVE",
      },
    });

    return { upserted, packages: packages.length };
  } catch (error) {
    await prisma.provider.update({
      where: { id: providerId },
      data: { syncStatus: "FAILED", status: "ERROR" },
    });
    throw error;
  }
}

/** Sync all active providers */
export async function syncAllProviders() {
  const providers = await prisma.provider.findMany({
    where: { status: { in: ["ACTIVE", "ERROR"] } },
  });
  const results: { providerId: string; code: string; upserted: number }[] = [];
  for (const p of providers) {
    const r = await syncProviderProducts(p.id);
    results.push({ providerId: p.id, code: p.code, upserted: r.upserted });
  }
  return results;
}
