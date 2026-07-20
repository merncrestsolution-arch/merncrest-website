import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Public catalog — selling prices only (provider cost never exposed). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        priceCents: true,
        currency: true,
        billingPeriod: true,
        featured: true,
        sortOrder: true,
        marketingTitle: true,
        marketingBanner: true,
        marketingBody: true,
        specsJson: true,
        providerId: true,
        lastSyncedAt: true,
      },
    });

    const publicProducts = products.map((p) => ({
      ...p,
      name: p.marketingTitle || p.name,
      description: p.marketingBody || p.description,
    }));

    return NextResponse.json({ products: publicProducts });
  } catch (error) {
    console.error("[catalog]", error);
    return NextResponse.json(
      { error: "Catalog unavailable", products: [] },
      { status: 503 }
    );
  }
}
