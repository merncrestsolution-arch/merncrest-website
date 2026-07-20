import { prisma } from "@/lib/db";

export type HostingNeed = {
  projectType?: string;
  visitors?: string | number;
  storageGb?: string | number;
  needsEmail?: boolean;
  needsSsl?: boolean;
  budgetCents?: number;
  description?: string;
};

type ScoredPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  billingPeriod: string;
  score: number;
  reasons: string[];
  marketingTitle: string | null;
  marketingBody: string | null;
};

/**
 * AI hosting recommendation — matches project description to synced provider packages.
 */
export async function recommendHosting(need: HostingNeed): Promise<{
  recommendation: ScoredPlan | null;
  alternatives: ScoredPlan[];
  summary: string;
}> {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      category: { in: ["hosting", "vps", "cloud"] },
    },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });

  if (products.length === 0) {
    return {
      recommendation: null,
      alternatives: [],
      summary:
        "No hosting packages synced yet. Ask an admin to sync providers from Admin → Providers.",
    };
  }

  const text = [
    need.description,
    need.projectType,
    need.needsEmail ? "email" : "",
    need.needsSsl ? "ssl" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const visitors =
    typeof need.visitors === "string" ? parseInt(need.visitors, 10) || 0 : need.visitors || 0;
  const storage =
    typeof need.storageGb === "string"
      ? parseInt(need.storageGb, 10) || 0
      : need.storageGb || 0;

  const scored: ScoredPlan[] = products.map((p) => {
    let score = 10;
    const reasons: string[] = [];
    const blob = `${p.name} ${p.description} ${p.slug}`.toLowerCase();

    if (/wordpress|blog|cms/.test(text) && /wordpress|wp/.test(blob)) {
      score += 40;
      reasons.push("Optimized for WordPress / CMS workloads");
    }
    if (/ecommerce|shop|store|pos/.test(text) && /business|cloud|vps/.test(blob)) {
      score += 35;
      reasons.push("Suitable for e-commerce traffic and apps");
    }
    if (/enterprise|erp|crm|saas|api/.test(text) && /vps|cloud|dedicated|aws/.test(blob)) {
      score += 40;
      reasons.push("Scalable VPS/cloud for enterprise software");
    }
    if (visitors > 50000 && /cloud|vps/.test(blob)) {
      score += 25;
      reasons.push("Handles higher visitor volume");
    } else if (visitors > 0 && visitors < 5000 && /shared|starter/.test(blob)) {
      score += 20;
      reasons.push("Cost-effective for low-to-moderate traffic");
    }
    if (storage >= 50 && /business|cloud|vps/.test(blob)) {
      score += 15;
      reasons.push("More disk capacity for larger sites");
    }
    if (need.budgetCents && p.priceCents <= need.budgetCents) {
      score += 15;
      reasons.push("Within your stated budget");
    } else if (need.budgetCents && p.priceCents > need.budgetCents * 1.5) {
      score -= 20;
    }
    if (/shared|starter/.test(blob) && !/enterprise|vps/.test(text)) {
      score += 5;
    }

    if (reasons.length === 0) reasons.push("General-purpose plan from our reseller catalog");

    return {
      id: p.id,
      slug: p.slug,
      name: p.marketingTitle || p.name,
      description: p.marketingBody || p.description,
      category: p.category,
      priceCents: p.priceCents,
      currency: p.currency,
      billingPeriod: p.billingPeriod,
      score,
      reasons,
      marketingTitle: p.marketingTitle,
      marketingBody: p.marketingBody,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const recommendation = scored[0] ?? null;
  const alternatives = scored.slice(1, 4);

  const summary = recommendation
    ? `Based on your project, we recommend **${recommendation.name}** (${recommendation.category}). ${recommendation.reasons[0]}. Packages are resold via our provider network — not hosted on MernCrest-owned servers.`
    : "Unable to recommend a plan.";

  return { recommendation, alternatives, summary };
}
