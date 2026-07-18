import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[catalog]", error);
    return NextResponse.json(
      { error: "Catalog unavailable", products: [] },
      { status: 503 }
    );
  }
}
